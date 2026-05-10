'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  interviewId: string;
  initialMessages: Message[];
  onMessagesUpdate?: (messages: Message[]) => void;
  disabled?: boolean;
}

export function ChatInterface({
  interviewId,
  initialMessages,
  onMessagesUpdate,
  disabled = false,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
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

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

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
              // Stream complete
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
        // User cancelled - save what we have
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
        // Show error as system message
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

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
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

      {/* Input area */}
      <div className="border-t bg-card p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
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
              onClick={() => abortControllerRef.current?.abort()}
              title="停止生成"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || disabled}
              title="发送"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
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
      {/* Avatar */}
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

      {/* Message content */}
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-muted text-foreground',
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
