import { createHtmlResource } from '@mcp-ui/server';

// Check if content is already an HTML resource
export function isHtmlResource(content: any): boolean {
  return content && 
         typeof content === 'object' && 
         content.uri && 
         content.content && 
         (content.content.type === 'rawHtml' || content.content.type === 'externalUrl');
}

// Create HTML resource for inline HTML content
export function createInlineHtmlResource(htmlString: string, uri?: string): any {
  return {
    uri: uri || `ui://inline/${Date.now()}`,
    content: { 
      type: 'rawHtml', 
      htmlString 
    },
    delivery: 'text',
  };
}

// Create HTML resource for external URL (iframe)
export function createExternalUrlResource(url: string, uri?: string): any {
  return {
    uri: uri || `ui://external/${encodeURIComponent(url)}`,
    content: { 
      type: 'externalUrl', 
      iframeUrl: url 
    },
    delivery: 'text',
  };
}

// Check if a string is a valid URL
export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Enhanced function to convert various result formats to HTML resources
export function convertToHtmlResource(result: any): any {
  // If already HTML resource, return as-is
  if (isHtmlResource(result)) return result;
  
  // Handle direct string
  if (typeof result === 'string') {
    // Check if it's HTML content
    if (result.trim().startsWith('<') && result.trim().endsWith('>')) {
      return createInlineHtmlResource(result);
    }
    
    // Check if it's a URL - display as iframe
    if (isValidUrl(result)) {
      return createExternalUrlResource(result);
    }
  }
  
  // Handle object with content properties
  if (result && typeof result === 'object') {
    // Check for common HTML content patterns
    if (result.html || result.htmlContent || result.htmlString) {
      const htmlContent = result.html || result.htmlContent || result.htmlString;
      return createInlineHtmlResource(htmlContent);
    }
    
    // Check for URL patterns - display as iframe
    if (result.url || result.iframeUrl || result.embedUrl) {
      const url = result.url || result.iframeUrl || result.embedUrl;
      if (isValidUrl(url)) {
        return createExternalUrlResource(url);
      }
    }
    
    // Handle MCP resource format
    if (result.content && Array.isArray(result.content)) {
      for (const item of result.content) {
        if (item.type === "resource" && item.resource?.text) {
          const content = item.resource.text;
          
          // Check if it's HTML content
          if (content.trim().startsWith('<') && content.trim().endsWith('>')) {
            return createInlineHtmlResource(content);
          }
          
          // Check if it's a URL - display as iframe
          if (isValidUrl(content)) {
            return createExternalUrlResource(content);
          }
        }
      }
    }
  }
  
  return result;
}
