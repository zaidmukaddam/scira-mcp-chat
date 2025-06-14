"use client";

import React, { useState } from 'react';
import { HtmlResource } from '@mcp-ui/client';
import { AlertCircle, ExternalLink, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HtmlResourceRendererProps {
  resource: any;
  className?: string;
}

export function HtmlResourceRenderer({ resource, className }: HtmlResourceRendererProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (error: any) => {
    console.error('HtmlResource rendering error:', error);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Extract URL for external resources
  const getResourceUrl = () => {
    if (resource?.content?.iframeUrl) {
      return resource.content.iframeUrl;
    }
    return null;
  };

  // Check if this is an external URL resource
  const isExternalResource = resource?.content?.type === 'externalUrl';
  const resourceUrl = getResourceUrl();

  if (hasError) {
    return (
      <div className={cn(
        "w-full rounded-md overflow-hidden my-2 border border-destructive/20 bg-destructive/5",
        className
      )}>
        <div className="p-4 text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
          <p className="text-sm text-destructive font-medium">
            Failed to load external widget
          </p>
          {resourceUrl && (
            <a
              href={resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Open in new tab
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full rounded-md overflow-hidden my-2 border border-border relative",
      className
    )}>
      {/* Header for external widgets */}
      {isExternalResource && resourceUrl && (
        <div className="bg-muted/30 border-b border-border/40 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span className="font-medium">External Widget</span>
            <span className="text-muted-foreground/70">•</span>
            <span className="truncate max-w-[200px]" title={resourceUrl}>
              {new URL(resourceUrl).hostname}
            </span>
          </div>
          <a
            href={resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading content...
          </div>
        </div>
      )}
      
      {/* The actual HtmlResource component */}
      <HtmlResource
        resource={resource}
        onUiAction={(result) => {
          console.log('HtmlResource action:', result);
          return Promise.resolve({ status: 'ok' });
        }}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}