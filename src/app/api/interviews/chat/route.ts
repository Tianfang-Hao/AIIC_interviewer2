import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import {
  buildInterviewSystemPrompt,
  type InterviewContext,
} from '@/lib/ai/interview-prompts';
import type { InterviewRound, InterviewStyle } from '@/generated/prisma/enums';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { interviewId, message } = body as {
      interviewId: string;
      message: string;
    };

    if (!interviewId || !message) {
      return Response.json(
        { error: '缺少面试ID或消息内容' },
        { status: 400 }
      );
    }

    // Fetch the interview
    const interview = await prisma.mockInterview.findUnique({
      where: { id: interviewId },
      include: {
        job: {
          select: {
            company: true,
            positionName: true,
            department: true,
            jdContent: true,
            requirements: true,
          },
        },
      },
    });

    if (!interview) {
      return Response.json({ error: '面试不存在' }, { status: 404 });
    }

    if (interview.userId !== session.user.id) {
      return Response.json({ error: '无权访问此面试' }, { status: 403 });
    }

    // Get resume data
    let resumeData: Record<string, unknown> | null = null;
    const resume = await prisma.resume.findFirst({
      where: { userId: session.user.id, parsedData: { not: Prisma.DbNull } },
      orderBy: { updatedAt: 'desc' },
      select: { parsedData: true },
    });
    if (resume?.parsedData) {
      resumeData = resume.parsedData as Record<string, unknown>;
    }

    // Build context
    const ctx: InterviewContext = {
      round: interview.round as InterviewRound,
      style: interview.style as InterviewStyle,
      jobInfo: interview.job,
      resumeData,
    };

    const systemPrompt = buildInterviewSystemPrompt(ctx);

    // Get existing messages and add the new user message
    const existingMessages = (interview.messages as unknown as ChatMessage[]) || [];
    const updatedMessages: ChatMessage[] = [
      ...existingMessages,
      { role: 'user', content: message },
    ];

    // Save the user message immediately
    await prisma.mockInterview.update({
      where: { id: interviewId },
      data: { messages: JSON.parse(JSON.stringify(updatedMessages)) },
    });

    // Build API messages for Claude
    const apiMessages = updatedMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY is not set' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Create streaming response
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    });

    const encoder = new TextEncoder();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const text = event.delta.text;
              fullResponse += text;
              // Send as SSE format
              const sseData = `data: ${JSON.stringify({ text })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
          }

          // Send done event
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

          // Save the assistant response to the database
          const finalMessages: ChatMessage[] = [
            ...updatedMessages,
            { role: 'assistant', content: fullResponse },
          ];
          await prisma.mockInterview.update({
            where: { id: interviewId },
            data: {
              messages: JSON.parse(JSON.stringify(finalMessages)),
            },
          });
        } catch (error) {
          console.error('Stream error:', error);
          const errMsg = `data: ${JSON.stringify({ error: '生成回复时出错' })}\n\n`;
          controller.enqueue(encoder.encode(errMsg));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return Response.json({ error: '面试对话出错' }, { status: 500 });
  }
}
