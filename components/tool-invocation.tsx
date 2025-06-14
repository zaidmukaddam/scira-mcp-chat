"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2,
  CheckCircle2,
  TerminalSquare,
  Code,
  ArrowRight,
  Circle,
  Globe,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HtmlResource } from "@mcp-ui/client";
import type { UseChatHelpers, Message as TMessage } from "@ai-sdk/react";
import { nanoid } from "nanoid";

// Define interfaces for better type safety
interface HtmlResourceData {
  uri: string;
  mimeType?: "text/html";
  text?: string;
  blob?: string;
  content?: {
    type: string;
    htmlString?: string;
    iframeUrl?: string;
  };
  delivery?: string;
  [key: string]: any; // Allow other fields
}

interface ContentItemWithHtmlResource {
  type: "resource";
  resource: HtmlResourceData;
}

// Generic content item
interface ContentItem {
  type: string;
  [key: string]: any;
}

// Expected structure of the parsed result string
interface ParsedResultContainer {
  content: ContentItem[];
}

interface ToolInvocationProps {
  toolName: string;
  state: string;
  args: any;
  result: any;
  isLatestMessage: boolean;
  status: string;
  append?: UseChatHelpers['append'];
}

export const ToolInvocation = memo(function ToolInvocation({
  toolName,
  state,
  args,
  result,
  isLatestMessage,
  status,
  append,
}: ToolInvocationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [htmlResourceContents, setHtmlResourceContents] = useState<HtmlResourceData[]>([]);

  // Function to convert URL to a compatible resource object
  const createExternalUrlResource = (url: string): HtmlResourceData => {
    return {
      uri: `ui://external/${encodeURIComponent(url)}`,
      content: {
        type: 'externalUrl',
        iframeUrl: url
      },
      delivery: 'text',
    };
  };

  // Function to convert HTML string to a compatible resource object
  const createHtmlResource = (html: string): HtmlResourceData => {
    return {
      uri: `ui://inline/${Date.now()}`,
      content: {
        type: 'rawHtml',
        htmlString: html
      },
      delivery: 'text',
    };
  };

  useEffect(() => {
    let processedContainer: ParsedResultContainer | null = null;

    if (result && typeof result === 'object' && result.content && Array.isArray(result.content)) {
      processedContainer = result as ParsedResultContainer;
    } else if (typeof result === 'string') {
      try {
        const parsed = JSON.parse(result);
        if (parsed && typeof parsed === 'object' && parsed.content && Array.isArray(parsed.content)) {
          processedContainer = parsed as ParsedResultContainer;
        } else if (parsed) {
          console.warn("Parsed string result does not have the expected .content array structure:", parsed);
        }
      } catch (error) {
        // Handle direct URL or HTML string
        if (typeof result === 'string') {
          if (result.trim().startsWith('http')) {
            // It's a URL - create an HTML resource for it
            const resource = createExternalUrlResource(result);
            setHtmlResourceContents([resource]);
            return;
          } else if (result.trim().startsWith('<') && result.trim().endsWith('>')) {
            // It's HTML content - create an HTML resource for it
            const resource = createHtmlResource(result);
            setHtmlResourceContents([resource]);
            return;
          }
        }
        console.error("Failed to parse string result for HtmlResource:", error);
        setHtmlResourceContents(prev => prev.length > 0 ? [] : prev);
        return;
      }
    } else if (result !== null && result !== undefined) {
      // Check if result has HTML or URL properties
      if (typeof result === 'object') {
        // Check if it's already a valid resource
        if (result.uri && (result.mimeType === "text/html" || result.text || result.content)) {
          setHtmlResourceContents([result]);
          return;
        }
        
        // Check for URL properties
        if (result.url || result.iframeUrl || result.embedUrl) {
          const url = result.url || result.iframeUrl || result.embedUrl;
          if (typeof url === 'string' && url.trim().startsWith('http')) {
            const resource = createExternalUrlResource(url);
            setHtmlResourceContents([resource]);
            return;
          }
        }
        
        // Check for HTML content properties
        if (result.html || result.htmlContent || result.htmlString) {
          const html = result.html || result.htmlContent || result.htmlString;
          if (typeof html === 'string') {
            const resource = createHtmlResource(html);
            setHtmlResourceContents([resource]);
            return;
          }
        }
      }
      
      console.warn("Result has an unexpected type or structure:", result);
      setHtmlResourceContents(prev => prev.length > 0 ? [] : prev);
      return;
    }

    if (processedContainer) {
      try {
        const newHtmlResources = processedContainer.content
          .filter(
            (item): item is ContentItemWithHtmlResource =>
              item.type === "resource" &&
              item.resource &&
              item.resource.uri &&
              item.resource.uri.startsWith("ui://")
          )
          .map((item) => item.resource);

        setHtmlResourceContents(prevContents => {
          const newUris = newHtmlResources.map(r => r.uri).sort();
          const currentUris = prevContents.map(r => r.uri).sort();
            
          if (JSON.stringify(newUris) !== JSON.stringify(currentUris)) {
            if (newHtmlResources.length > 0) {
              setIsExpanded(currentExpandedState => {
                if (!currentExpandedState) return true;
                return currentExpandedState;
              });
            }
            return newHtmlResources;
          }
          return prevContents;
        });
      } catch (error) {
        console.error("Error processing content for HtmlResource:", error);
        setHtmlResourceContents(prev => prev.length > 0 ? [] : prev);
      }
    } else {
      setHtmlResourceContents(prev => prev.length > 0 ? [] : prev);
    }
  }, [result]);
  
  const getStatusIcon = () => {
    if (state === "call") {
      if (isLatestMessage && status !== "ready") {
        return <Loader2 className="animate-spin h-3.5 w-3.5 text-primary/70" />;
      }
      return <Circle className="h-3.5 w-3.5 fill-muted-foreground/10 text-muted-foreground/70" />;
    }
    return <CheckCircle2 size={14} className="text-primary/90" />;
  };

  const getStatusClass = () => {
    if (state === "call") {
      if (isLatestMessage && status !== "ready") {
        return "text-primary";
      }
      return "text-muted-foreground";
    }
    return "text-primary";
  };

  const formatContent = (content: any): string => {
    try {
      if (typeof content === "string") {
        if (!content.trim().startsWith("{") && !content.trim().startsWith("[")) {
          return content;
        }
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

  const resourceStyle = useMemo(() => ({ minHeight: 425 }), []);

  const handleUiAction = useCallback(async (toolCallName: string, toolCallParams: any) => {
    if (append) {
      const userMessageContent = `Call ${toolCallName} with parameters: ${JSON.stringify(toolCallParams)}`;
      
      const newMessage: TMessage = {
        id: nanoid(),
        role: 'user',
        content: userMessageContent,
      };

      append(newMessage);
      
      return Promise.resolve({ status: "ok", message: "Tool execution requested via append" });
    } else {
      console.warn("append function not available in ToolInvocation for UI action");
      return Promise.resolve({ status: "error", message: "Chat context (append) not available for UI action" });
    }
  }, [append]);

  // Enhanced rendering of resources with iframe fallback for external URLs
  const renderedHtmlResources = useMemo(() => {
    console.log("Rendering HTML resources:", htmlResourceContents);
    return htmlResourceContents.map((resourceData, index) => {
      // Check if this is an external URL resource
      const isExternalUrl = resourceData.content?.type === 'externalUrl';
      const externalUrl = isExternalUrl ? resourceData.content?.iframeUrl : null;
      
      return (
        <div key={resourceData.uri || `html-resource-${index}`} className="relative border border-border rounded-md overflow-hidden">
          {/* Header for external URLs */}
          {isExternalUrl && externalUrl && (
            <div className="bg-muted/30 border-b border-border/40 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="font-medium">External Widget</span>
                <span className="text-muted-foreground/70">•</span>
                <span className="truncate max-w-[200px]" title={externalUrl}>
                  {new URL(externalUrl).hostname}
                </span>
              </div>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          
          {/* For external URLs, show direct iframe */}
          {isExternalUrl && externalUrl ? (
            <iframe 
              src={externalUrl} 
              style={resourceStyle}
              className="w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              loading="lazy"
            />
          ) : (
            <HtmlResource
              resource={resourceData}
              style={resourceStyle}
              onUiAction={handleUiAction}
            />
          )}
        </div>
      );
    });
  }, [htmlResourceContents, resourceStyle, handleUiAction]);

  return (
    <div className={cn(
      "flex flex-col mb-2 rounded-md border border-border/50 overflow-hidden",
      "bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm",
      "transition-all duration-200 hover:border-border/80 group"
    )}>
      <div 
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors",
          "hover:bg-muted/20"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-center rounded-full w-5 h-5 bg-primary/5 text-primary">
          <TerminalSquare className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground flex-1">
          <span className="text-foreground font-semibold tracking-tight">{toolName}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
          <span className={cn("font-medium", getStatusClass())}>
            {state === "call" ? (isLatestMessage && status !== "ready" ? "Running" : "Waiting") : "Completed"}
          </span>
        </div>
        <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
          {getStatusIcon()}
          <div className="bg-muted/30 rounded-full p-0.5 border border-border/30">
            {isExpanded ? (
              <ChevronUpIcon className="h-3 w-3 text-foreground/70" />
            ) : (
              <ChevronDownIcon className="h-3 w-3 text-foreground/70" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2 px-3 pb-3">
          {!!args && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 pt-1.5">
                <Code className="h-3 w-3" />
                <span className="font-medium">Arguments</span>
              </div>
              <pre className={cn(
                "text-xs font-mono p-2.5 rounded-md overflow-x-auto",
                "border border-border/40 bg-muted/10"
              )}>
                {formatContent(args)}
              </pre>
            </div>
          )}
          
          {!!result && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <ArrowRight className="h-3 w-3" />
                <span className="font-medium">
                  {htmlResourceContents.length > 0 ? "External Widget" : "Result"}
                </span>
              </div>

              <div className="p-3 pt-0">
                {htmlResourceContents.length > 0 ? 
                  renderedHtmlResources : 
                  <pre className={cn(
                    "text-xs font-mono p-2.5 rounded-md overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap",
                    "border border-border/40 bg-muted/10"
                  )}>
                    {formatContent(result)}
                  </pre>
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});