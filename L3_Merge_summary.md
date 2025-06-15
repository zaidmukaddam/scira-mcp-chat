# L3 Merge Summary

## Overview

The initial phase of the project involved understanding the overall architecture and flow. As the React.js framework was relatively new to me, I began by exploring its components and identifying which components contributed to which functionalities.

Initially, the codebase was quite overwhelming — especially understanding how the SDK was integrated, which files contributed to which features, the flow of operations when a user initiated a chat, and where the server and client were initialized. The tool system and tool invocation mechanism were also unclear. I approached the problem methodically, addressing one question at a time. Over time, I gained a clear understanding of the project architecture and data flow.

---

## Database Integration Attempt

I attempted to implement the database connection using a local PostgreSQL setup. However, the original code for DB integration contained issues. As a workaround, I replaced the placeholder with a valid **Groq API key**, which successfully allowed the application to function.

---

## Iframe Functionality for Visualizations and External Links

The core objective of the task was to **add iframe functionality** that supports rendering both visualizations and external links directly within the chat interface.

To accomplish this, I created the following:

### New File:
- `mcp-resource-utils.ts`

### New Component:
- `HTMLResourceRenderer`

These additions served the following purposes:

- **Conversion** of various result formats (e.g., plain HTML, URLs, or objects containing HTML/URLs) into a standardized **MCP HTML resource** structure.
- **Automatic detection** of content types (HTML strings, URLs, or objects with specific properties).
- **Creation** of properly formatted resources for both **inline HTML** content and **external URLs** (iframes).
- **Client-side rendering** of the returned HTML resources via the `HTMLResourceRenderer`.

### Import and Usage

These utilities and components were imported in various parts of the codebase:

- **Chat UI Components**: Components in the `components` directory responsible for chat message rendering and displaying rich MCP responses.
- **MCP Integration Files**: Especially `providers.ts`, which integrates with various AI providers and processes their responses.
- **Chat Processing Utilities**: Various files within the `lib` directory that handle message processing logic.

---

## Challenges Faced During `ToolInvocation.tsx` Integration

Despite successfully creating the utilities, rendering returned content using `HTMLResourceRenderer` inside `ToolInvocation.tsx` did not work as expected. After multiple iterations of trial and error, I referred to the `scira-mcp-ui-chat` repository to understand the proper iframe rendering structure. 
Taking inspiration from it the dependancy of `HTMLResourceRenderer` has be removed and implemented directly inside `ToolInvocation.tsx` to make things simpler and modified in order to make it work with the changed iframe rendering structure.

### Key Rendering Structure:

```tsx
const renderedHtmlResources = useMemo(() => {
  // ...
  {/* The actual iframe rendering */}
  return isExternalUrl && externalUrl ? (
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
  );
// ..
}, [htmlResourceContents, resourceStyle, handleUiAction]);
