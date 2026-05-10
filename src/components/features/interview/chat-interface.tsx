'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Square, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { CoachPanel } from './coach-panel';
import type { CoachCard } from '@/lib/ai/interview-coach';

// ---- Types ----

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  interviewId: string;
  round: string;
  initialMessages: Message[];
  initialCoachCards: CoachCard[];
  onMessagesUpdate?: (messages: Message[]) => void;
  disabled?: boolean;
}

// ---- Component ----

export function ChatInterface({
  interviewId,
  round,
  initialMessages,
  initialCoachCards,
  onMessagesUpdate,
  disabled = false,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [coachCards, setCoachCards] = useState<CoachCard[]>(initialCoachCards);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [coachLoadingIndex, setCoachLoadingIndex] = useState<number | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Compute questionIndex from messages: count completed Q&A pairs
  // A Q&A pair = an assistant message (question) followed by a user message (answer)
  const getQuestionIndex = useCallback((msgs: Message[]): number => {
    let count = 0;
    for (let i = 0; i < msgs.length; i++) {
      if (msgs[i].role === 'user' && i > 0) {
        count++;
      }
    }
    return count;
  }, []);

  // Get the last assistant message (the question the user is answering)
  const getLastQuestion = useCallback((msgs: Message[]): string => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') {
        return msgs[i].content;
      }
    }
    return '';
  }, []);

  // Auto-scroll chat to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ---- Coach API ----

  const requestCoachFeedback = useCallback(
    async (question: string, answer: string, questionIndex: number) => {
      setCoachLoadingIndex(questionIndex);
      try {
        const res = await fetch('/api/interviews/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewId,
            question,
            answer,
            round,
            questionIndex,
          }),
        });

        if (!res.ok) {
          console.error('Coach API error:', await res.text());
          return;
        }

        const data = await res.json();
        if (data.coachCard) {
          setCoachCards((prev) => [...prev, data.coachCard]);
        }
      } catch (err) {
        console.error('Coach feedback error:', err);
      } finally {
        setCoachLoadingIndex(null);
      }
    },
    [interviewId, round]
  );

  // ---- Rewind ----

  const handleRewind = useCallback(
    async (questionIndex: number) => {
      // Find the message index of the assistant message for this question
      // questionIndex corresponds to the nth Q&A pair (0-based)
      // The first assistant message is the initial question (questionIndex 0)
      // We need to find the assistant message at this questionIndex
      let assistantCount = -1; // start at -1 because first assistant msg is index 0
      let rewindToMessageIndex = -1;

      for (let i = 0; i < messages.length; i++) {
        if (messages[i].role === 'assistant') {
          assistantCount++;
          if (assistantCount === questionIndex) {
            rewindToMessageIndex = i;
            break;
          }
        }
      }

      if (rewindToMessageIndex === -1) return;

      try {
        const res = await fetch(`/api/interviews/${interviewId}/rewind`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rewindToIndex: rewindToMessageIndex }),
        });

        if (!res.ok) {
          console.error('Rewind error:', await res.text());
          return;
        }

        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
          onMessagesUpdate?.(data.messages);
        }

        // Remove coach cards from this questionIndex onward
        setCoachCards((prev) =>
          prev.filter((c) => c.questionIndex < questionIndex)
        );
      } catch (err) {
        console.error('Rewind error:', err);
      }
    },
    [interviewId, messages, onMessagesUpdate]
  );

  // ---- Bookmark ----

  const handleBookmark = useCallback((questionIndex: number) => {
    setCoachCards((prev) =>
      prev.map((c) =>
        c.questionIndex === questionIndex
          ? { ...c, isBookmarked: !c.isBookmarked }
          : c
      )
    );
  }, []);

  // ---- Send message ----

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;

    // Get the question before adding user message
    const question = getLastQuestion(messages);
    const questionIndex = getQuestionIndex([...messages, { role: 'user', content: trimmed }]) - 1;

    const userMessage: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Start coach feedback request in parallel (only if there's a question to evaluate)
    if (question) {
      requestCoachFeedback(question, trimmed, questionIndex);
    }

    try {
      const res = await fetch('/api/interviews/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, message: trimmed }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || '发送消息失败');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              const assistantMessage: Message = {
                role: 'assistant',
                content: accumulated,
              };
              const finalMessages = [...updatedMessages, assistantMessage];
              setMessages(finalMessages);
              setStreamingContent('');
              onMessagesUpdate?.(finalMessages);
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                setStreamingContent(accumulated);
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        if (streamingContent) {
          const assistantMessage: Message = {
            role: 'assistant',
            content: streamingContent,
          };
          const finalMessages = [...updatedMessages, assistantMessage];
          setMessages(finalMessages);
          onMessagesUpdate?.(finalMessages);
        }
      } else {
        console.error('Chat error:', error);
        const errorMessage: Message = {
          role: 'assistant',
          content: `[系统错误] ${(error as Error).message || '面试对话出错，请重试'}`,
        };
        setMessages([...updatedMessages, errorMessage]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ---- Coach panel content (shared between desktop and mobile sheet) ----

  const coachPanelContent = (
    <CoachPanel
      cards={coachCards}
      loadingIndex={coachLoadingIndex}
      onRewind={handleRewind}
      onBookmark={handleBookmark}
    />
  );

  return (
    <div className="flex h-full">
      {/* Desktop: two-column layout */}
      <div className="hidden h-full md:grid md:flex-1 md:grid-cols-2 md:gap-0">
        {/* Left pane: Chat */}
        <div className="flex h-full flex-col border-r">
          <ChatMessages
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            messagesEndRef={messagesEndRef}
          />
          <ChatInput
            input={input}
            setInput={setInput}
            isStreaming={isStreaming}
            disabled={disabled}
            onSend={sendMessage}
            onKeyDown={handleKeyDown}
            onAbort={() => abortControllerRef.current?.abort()}
            inputRef={inputRef}
          />
        </div>

        {/* Right pane: Coach Panel */}
        <div className="h-full overflow-hidden">
          {coachPanelContent}
        </div>
      </div>

      {/* Mobile: full-width chat + floating coach button */}
      <div className="flex h-full w-full flex-col md:hidden">
        <ChatMessages
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          messagesEndRef={messagesEndRef}
        />
        <ChatInput
          input={input}
          setInput={setInput}
          isStreaming={isStreaming}
          disabled={disabled}
          onSend={sendMessage}
          onKeyDown={handleKeyDown}
          onAbort={() => abortControllerRef.current?.abort()}
          inputRef={inputRef}
        />

        {/* Floating coach button */}
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetTrigger
            render={
              <Button
                variant="default"
                size="sm"
                className="fixed bottom-20 right-4 z-40 shadow-lg"
              />
            }
          >
            <MessageCircle className="mr-1.5 h-4 w-4" />
            教练点评
            {coachCards.length > 0 && (
              <Badge variant="secondary" className="ml-1.5">
                {coachCards.length}
              </Badge>
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle>AI 教练点评</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden">
              {coachPanelContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function ChatMessages({
  messages,
  isStreaming,
  streamingContent,
  messagesEndRef,
}: {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} message={msg} />
      ))}
      {isStreaming && streamingContent && (
        <MessageBubble
          message={{ role: 'assistant', content: streamingContent }}
          isStreaming
        />
      )}
      {isStreaming && !streamingContent && (
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            面
          </div>
          <div className="rounded-lg bg-muted px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

function ChatInput({
  input,
  setInput,
  isStreaming,
  disabled,
  onSend,
  onKeyDown,
  onAbort,
  inputRef,
}: {
  input: string;
  setInput: (v: string) => void;
  isStreaming: boolean;
  disabled: boolean;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onAbort: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div className="border-t bg-card p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            disabled
              ? '面试已结束'
              : isStreaming
                ? '等待面试官回复...'
                : '输入你的回答... (Enter 发送, Shift+Enter 换行)'
          }
          disabled={disabled || isStreaming}
          rows={2}
          className="flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isStreaming ? (
          <Button
            size="icon"
            variant="outline"
            onClick={onAbort}
            title="停止生成"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={onSend}
            disabled={!input.trim() || disabled}
            title="发送"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isStreaming = false,
}: {
  message: Message;
  isStreaming?: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {isUser ? '我' : '面'}
      </div>

      <div
        className={cn(
          'max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
          isUser ? 'bg-blue-600 text-white' : 'bg-muted text-foreground',
          isStreaming && 'animate-pulse'
        )}
      >
        {message.content}
        {isStreaming && (
          <span className="inline-block w-1 h-4 ml-0.5 bg-foreground/60 animate-pulse" />
        )}
      </div>
    </div>
  );
}
