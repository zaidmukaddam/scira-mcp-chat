"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2,
  CheckCircle2,
  TerminalSquare,
  Code,
  ArrowRight,
  Circle,
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
        return <Loader2 className="animate-spin h-3.5 w-3.5 text-muted-foreground/70" />;
      }
      return <Circle className="h-3.5 w-3.5 fill-destructive/20 text-destructive/70" />;
    }
    return <CheckCircle2 size={14} className="text-success/90" />;
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
    <div className="flex flex-col mb-3 bg-muted/30 rounded-lg border border-border/40 overflow-hidden">
      <div 
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-center w-5 h-5">
          <TerminalSquare className="h-3.5 w-3.5 text-primary/70" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground flex-1">
          <span className="text-foreground/80">{toolName}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-foreground/60">{state === "call" ? "Running" : "Completed"}</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {isExpanded ? (
            <ChevronUpIcon className="h-3.5 w-3.5 text-muted-foreground/70" />
          ) : (
            <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground/70" />
          )}
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
            className="space-y-2 p-3 pt-1 border-t border-border/30"
          >
            {!!args && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <Code className="h-3 w-3" />
                  <span>Arguments</span>
                </div>
                <pre className="text-xs font-mono bg-background/50 p-3 rounded-md overflow-x-auto">
                  {formatContent(args)}
                </pre>
              </div>
            )}
            
            {!!result && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <ArrowRight className="h-3 w-3" />
                  <span>Result</span>
                </div>
                <pre className="text-xs font-mono bg-background/50 p-3 rounded-md overflow-x-auto max-h-[300px] overflow-y-auto">
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