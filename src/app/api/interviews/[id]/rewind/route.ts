import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { CoachCard } from '@/lib/ai/interview-coach';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { rewindToIndex } = body as { rewindToIndex: number };

    if (rewindToIndex == null || rewindToIndex < 0) {
      return Response.json(
        { error: '请提供有效的回退位置' },
        { status: 400 }
      );
    }

    // Fetch interview with ownership check
    const interview = await prisma.mockInterview.findUnique({
      where: { id },
    });

    if (!interview) {
      return Response.json({ error: '面试不存在' }, { status: 404 });
    }

    if (interview.userId !== session.user.id) {
      return Response.json({ error: '无权访问此面试' }, { status: 403 });
    }

    const messages = (interview.messages as unknown as ChatMessage[]) || [];

    // rewindToIndex refers to the message index of the question (assistant message)
    // we keep messages up to and including that question, removing the user answer and everything after
    if (rewindToIndex >= messages.length) {
      return Response.json(
        { error: '回退位置超出消息范围' },
        { status: 400 }
      );
    }

    // Keep messages from index 0 up to and including rewindToIndex
    const trimmedMessages = messages.slice(0, rewindToIndex + 1);

    // Trim coachCards: remove cards with questionIndex >= the rewound question's index
    // The rewound question's questionIndex corresponds to the question we're going back to
    // so we remove all cards for that question and after
    const existingCards = (interview.coachCards as unknown as CoachCard[]) || [];

    // Count how many assistant messages are at or before rewindToIndex to determine
    // which questionIndex to cut at. The question at rewindToIndex is being re-asked,
    // so its coach card (and all after) should be removed.
    // questionIndex is 0-based for the nth question in the interview.
    // Count assistant messages up to (but not including) rewindToIndex to get the questionIndex.
    let questionCount = 0;
    for (let i = 0; i < rewindToIndex; i++) {
      if (messages[i].role === 'assistant') {
        questionCount++;
      }
    }
    // If the message at rewindToIndex is an assistant message, its questionIndex = questionCount
    // We remove cards with questionIndex >= questionCount
    const trimmedCards = existingCards.filter(
      (card) => card.questionIndex < questionCount
    );

    // Update in DB
    await prisma.mockInterview.update({
      where: { id },
      data: {
        messages: JSON.parse(JSON.stringify(trimmedMessages)),
        coachCards: JSON.parse(JSON.stringify(trimmedCards)),
      },
    });

    return Response.json({
      success: true,
      messages: trimmedMessages,
    });
  } catch (error) {
    console.error('Rewind interview error:', error);
    return Response.json(
      { error: '回退面试失败，请稍后重试' },
      { status: 500 }
    );
  }
}
