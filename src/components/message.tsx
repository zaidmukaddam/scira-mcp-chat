'use client';

import type { Message as TMessage } from 'ai';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useCallback, useEffect, useState, useRef, useMemo } from 'react';
import equal from 'fast-deep-equal';
import { Markdown } from './markdown';
import { cn } from '@/lib/utils';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LightbulbIcon,
  BrainIcon,
  MaximizeIcon,
  MinimizeIcon,
} from 'lucide-react';
import { SpinnerIcon } from './icons';
import { ToolInvocation } from './tool-invocation';
import { CopyButton } from './copy-button';

interface ReasoningPart {
  type: 'reasoning';
  reasoning: string;
  details: Array<{ type: 'text'; text: string }>;
}

interface ReasoningMessagePartProps {
  part: ReasoningPart;
  isReasoning: boolean;
}

export function ReasoningMessagePart({
  part,
  isReasoning,
}: ReasoningMessagePartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const memoizedSetIsExpanded = useCallback((value: boolean) => {
    setIsExpanded(value);
  }, []);

  useEffect(() => {
    memoizedSetIsExpanded(isReasoning);
  }, [isReasoning, memoizedSetIsExpanded]);

  useEffect(() => {
    // Auto-scroll to bottom when new content is added during reasoning
    if (isReasoning && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isReasoning, part.details]);

  return (
    <div className="flex flex-col mb-2 group">
      {isReasoning ? (
        <div className="flex flex-col gap-2 w-full">
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-full py-1.5 px-3',
              'bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-300',
              'border border-indigo-200/50 dark:border-indigo-700/20 w-fit',
            )}
          >
            <div className="animate-spin h-3.5 w-3.5">
              <SpinnerIcon />
            </div>
            <div className="text-xs font-medium tracking-tight">
              Thinking...
            </div>
          </div>

          <div className="pl-3.5 ml-0.5 border-l border-border/50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground/70 pl-1 font-medium">
                The assistant&apos;s thought process:
              </div>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={cn(
                  'flex items-center justify-center p-1 rounded-md',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-muted/50 transition-colors',
                )}
              >
                {isFullscreen ? (
                  <MinimizeIcon className="h-3.5 w-3.5" />
                ) : (
                  <MaximizeIcon className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div className="mt-1">
              <div
                ref={scrollRef}
                className={cn(
                  'flex flex-col overflow-y-auto overflow-x-hidden',
                  'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent',
                  'border border-border rounded-md',
                  'text-sm text-muted-foreground',
                  {
                    'max-h-[300px]': !isFullscreen,
                    'max-h-[70vh]': isFullscreen,
                  },
                )}
              >
                {part.details.map((detail, detailIndex) =>
                  detail.type === 'text' ? (
                    <div
                      key={detailIndex}
                      className="px-3 py-2 border-b last:border-b-0 border-border/30"
                    >
                      <Markdown>{detail.text}</Markdown>
                    </div>
                  ) : (
                    '<redacted>'
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center justify-between w-full',
            'rounded-md py-2 px-3 mb-0.5',
            'bg-muted/50 border border-border/60 hover:border-border/80',
            'transition-all duration-150 cursor-pointer',
            isExpanded ? 'bg-muted border-primary/20' : '',
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex items-center justify-center w-6 h-6 rounded-full',
                'bg-amber-50 dark:bg-amber-900/20',
                'text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-700/30',
              )}
            >
              <LightbulbIcon className="h-3.5 w-3.5" />
            </div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
              Reasoning
              <span className="text-xs text-muted-foreground font-normal">
                (click to {isExpanded ? 'hide' : 'view'})
              </span>
            </div>
          </div>
          <div
            className={cn(
              'flex items-center justify-center',
              'rounded-full p-0.5 w-5 h-5',
              'text-muted-foreground hover:text-foreground',
              'bg-background/80 border border-border/50',
              'transition-colors',
            )}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-3 w-3" />
            ) : (
              <ChevronUpIcon className="h-3 w-3" />
            )}
          </div>
        </button>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && !isReasoning && (
          <motion.div
            key="reasoning"
            className={cn(
              'text-sm text-muted-foreground flex flex-col gap-2',
              'pl-3.5 ml-0.5 mt-1',
              'border-l border-border/50',
              'motion-div',
            )}
            initial={{ height: 0, opacity: 0.8 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground/70 pl-1 font-medium">
                The assistant&apos;s thought process:
              </div>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={cn(
                  'flex items-center justify-center p-1 rounded-md',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-muted/50 transition-colors',
                )}
              >
                {isFullscreen ? (
                  <MinimizeIcon className="h-3.5 w-3.5" />
                ) : (
                  <MaximizeIcon className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div>
              <div
                className={cn(
                  'flex flex-col overflow-y-auto overflow-x-hidden',
                  'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent',
                  'border border-border rounded-md',
                  'text-sm text-muted-foreground',
                  {
                    'max-h-[300px]': !isFullscreen && part.details.length > 2,
                    'max-h-[70vh]': isFullscreen,
                  },
                )}
              >
                {part.details.map((detail, detailIndex) =>
                  detail.type === 'text' ? (
                    <div
                      key={detailIndex}
                      className="px-3 py-2 border-b last:border-b-0 border-border/30"
                    >
                      <Markdown>{detail.text}</Markdown>
                    </div>
                  ) : (
                    '<redacted>'
                  ),
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Memoized text part component
const TextPart = memo(
  ({ text, role }: { text: string; role: TMessage['role'] }) => {
    return (
      <div
        className={cn('flex flex-col gap-3 w-full', {
          'bg-secondary text-secondary-foreground px-4 py-3 rounded-2xl':
            role === 'user',
        })}
      >
        <Markdown>{text}</Markdown>
      </div>
    );
  },
);
TextPart.displayName = 'TextPart';

// Memoized reasoning message part
const MemoizedReasoningMessagePart = memo(ReasoningMessagePart);
MemoizedReasoningMessagePart.displayName = 'MemoizedReasoningMessagePart';

const PurePreviewMessage = ({
  message,
  isLatestMessage,
  status,
}: {
  message: TMessage;
  isLoading: boolean;
  status: 'error' | 'submitted' | 'streaming' | 'ready';
  isLatestMessage: boolean;
}) => {
  // Create a string with all text parts for copy functionality
  const getMessageText = useCallback(() => {
    if (!message.parts) return '';
    return message.parts
      .filter((part) => part.type === 'text')
      .map((part) => (part.type === 'text' ? part.text : ''))
      .join('\n\n');
  }, [message.parts]);

  // Only show copy button if the message is from the assistant and not currently streaming
  const shouldShowCopyButton =
    message.role === 'assistant' &&
    (!isLatestMessage || status !== 'streaming');

  // Avoid recreating parts array on each render
  const messageId = message.id;
  const messageParts = useMemo(() => message.parts || [], [message.parts]);
  const messageRole = message.role;

  return (
    <div
      className={cn(
        'w-full mx-auto px-4 group/message',
        message.role === 'assistant' ? 'mb-8' : 'mb-6',
      )}
      data-role={messageRole}
    >
      <div
        className={cn(
          'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
          'group-data-[role=user]/message:w-fit',
        )}
      >
        <div className="flex flex-col w-full space-y-3">
          {messageParts.map((part, i) => {
            const key = `message-${messageId}-part-${i}`;

            switch (part.type) {
              case 'text':
                return (
                  <div
                    key={key}
                    className="flex flex-row gap-2 items-start w-full"
                  >
                    <TextPart text={part.text} role={messageRole} />
                  </div>
                );
              case 'tool-invocation':
                const { toolName, state, args } = part.toolInvocation;
                const result =
                  'result' in part.toolInvocation
                    ? part.toolInvocation.result
                    : null;

                return (
                  <ToolInvocation
                    key={key}
                    toolName={toolName}
                    state={state}
                    args={args}
                    result={result}
                    isLatestMessage={isLatestMessage}
                    status={status}
                  />
                );
              case 'reasoning':
                return (
                  <MemoizedReasoningMessagePart
                    key={key}
                    // @ts-expect-error part
                    part={part}
                    isReasoning={
                      (messageParts &&
                        status === 'streaming' &&
                        i === messageParts.length - 1) ??
                      false
                    }
                  />
                );
              default:
                return null;
            }
          })}
          {shouldShowCopyButton && (
            <div className="flex justify-start mt-2">
              <CopyButton text={getMessageText()} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoized PurePreviewMessage with proper comparison
export const Message = memo(PurePreviewMessage, (prevProps, nextProps) => {
  // Don't re-render if status is the same
  if (prevProps.status !== nextProps.status) return false;

  // Don't re-render if annotations are different
  if (prevProps.message.annotations !== nextProps.message.annotations)
    return false;

  // Don't re-render if parts are different using deep comparison
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

  // Don't re-render if isLatestMessage changes
  if (prevProps.isLatestMessage !== nextProps.isLatestMessage) return false;

  // Otherwise, don't re-render
  return true;
});
