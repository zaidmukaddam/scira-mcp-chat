"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2,
  PocketKnife,
  CheckCircle,
  StopCircle,
  Code2,
  Terminal,
} from "lucide-react";

interface ToolInvocationProps {
  toolName: string;
  state: string;
  args: any;
  result: any;
  isLatestMessage: boolean;
  status: string;
}

export function ToolInvocation({
  toolName,
  state,
  args,
  result,
  isLatestMessage,
  status,
}: ToolInvocationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
    },
  };

  const getStatusIcon = () => {
    if (state === "call") {
      if (isLatestMessage && status !== "ready") {
        return <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />;
      }
      return <StopCircle className="h-4 w-4 text-destructive" />;
    }
    return <CheckCircle size={14} className="text-success" />;
  };

  const formatContent = (content: any): string => {
    try {
      if (typeof content === "string") {
        try {
          const parsed = JSON.parse(content);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return content;
        }
      }
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 mb-4 bg-muted/50 rounded-xl border border-border backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-lg">
          <PocketKnife className="h-4 w-4" />
        </div>
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-medium">
            {state === "call" ? "Calling" : "Called"}
          </span>
          <code className="px-2 py-1 text-xs font-mono rounded-md bg-muted text-muted-foreground">
            {toolName}
          </code>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2 }}
            className="space-y-3 pt-2"
          >
            {!!args && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Arguments</span>
                </div>
                <pre className="text-xs font-mono bg-muted p-3 rounded-lg overflow-x-auto">
                  {formatContent(args)}
                </pre>
              </div>
            )}
            
            {!!result && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Result</span>
                </div>
                <pre className="text-xs font-mono bg-muted p-3 rounded-lg overflow-x-auto max-h-[300px] overflow-y-auto">
                  {formatContent(result)}
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 