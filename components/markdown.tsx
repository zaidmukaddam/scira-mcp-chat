/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link";
import React, { memo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  tomorrow,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";

// Code Block component with copy button
const CodeBlock = ({
  className,
  children,
}: {
  className?: string;
  children: string;
}) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const { theme } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Select appropriate theme based on the app's current theme
  const codeStyle =
    theme === "light" || theme === "sunset" ? oneLight : tomorrow;

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border mb-3 md:mb-4 w-full max-w-full">
      <div className="flex items-center justify-between px-3 md:px-4 py-1.5 bg-muted/50 text-muted-foreground text-xs font-mono">
        <span className="truncate">{language || "plain text"}</span>
        <button
          onClick={handleCopy}
          className="p-1 hover:text-foreground transition-colors ml-2 flex-shrink-0"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="w-full max-w-full overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={codeStyle}
          customStyle={{
            margin: 0,
            padding: "0.75rem 1rem",
            fontSize: "0.85em",
            backgroundColor: "var(--secondary)",
            borderRadius: 0,
            width: "100%",
            minWidth: "100%",
          }}
          PreTag="div"
          wrapLines
          wrapLongLines
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const components: Partial<Components> = {
  pre: ({ children, ...props }) => (
    <pre className="my-1.5 text-sm w-full max-w-full" {...props}>
      {children}
    </pre>
  ),
  code: ({
    children,
    className,
    ...props
  }: React.HTMLProps<HTMLElement> & { className?: string }) => {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !className;

    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded-md bg-secondary/50 text-foreground font-mono text-[0.85em] break-words"
          {...props}
        >
          {children}
        </code>
      );
    }

    // For code blocks, use our custom CodeBlock component
    return (
      <CodeBlock className={className}>{String(children).trim()}</CodeBlock>
    );
  },
  ol: ({ node, children, ...props }) => (
    <ol
      className="list-decimal list-outside ml-3 md:ml-4 space-y-0.5 my-1.5 text-sm sm:text-base"
      {...props}
    >
      {children}
    </ol>
  ),
  ul: ({ node, children, ...props }) => (
    <ul
      className="list-disc list-outside ml-3 md:ml-4 space-y-0.5 my-1.5 text-sm sm:text-base"
      {...props}
    >
      {children}
    </ul>
  ),
  li: ({ node, children, ...props }) => (
    <li className="leading-normal break-words" {...props}>
      {children}
    </li>
  ),
  p: ({ node, children, ...props }) => (
    <p
      className="leading-relaxed my-1.5 text-sm sm:text-base break-words"
      {...props}
    >
      {children}
    </p>
  ),
  strong: ({ node, children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  em: ({ node, children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  blockquote: ({ node, children, ...props }) => (
    <blockquote
      className="border-l-2 border-zinc-200 dark:border-zinc-700 black:border-zinc-700 pl-2 md:pl-3 my-1.5 italic text-zinc-600 dark:text-zinc-400 black:text-zinc-400 text-sm sm:text-base"
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({ node, children, ...props }) => (
    // @ts-expect-error error
    <Link
      className="text-blue-500 hover:underline hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 black:text-blue-400 black:hover:text-blue-300 transition-colors break-words"
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      {children}
    </Link>
  ),
  h1: ({ node, children, ...props }) => (
    <h1
      className="text-xl md:text-2xl font-semibold mt-3 mb-1.5 text-zinc-800 dark:text-zinc-200 black:text-zinc-200 break-words"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ node, children, ...props }) => (
    <h2
      className="text-lg md:text-xl font-semibold mt-2.5 mb-1.5 text-zinc-800 dark:text-zinc-200 black:text-zinc-200 break-words"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ node, children, ...props }) => (
    <h3
      className="text-base md:text-lg font-semibold mt-2 mb-1 text-zinc-800 dark:text-zinc-200 black:text-zinc-200 break-words"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ node, children, ...props }) => (
    <h4
      className="text-sm md:text-base font-semibold mt-2 mb-1 text-zinc-800 dark:text-zinc-200 black:text-zinc-200 break-words"
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ node, children, ...props }) => (
    <h5
      className="text-xs md:text-sm font-semibold mt-2 mb-1 text-zinc-800 dark:text-zinc-200 black:text-zinc-200 break-words"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ node, children, ...props }) => (
    <h6
      className="text-xs font-semibold mt-2 mb-0.5 text-zinc-800 dark:text-zinc-200 black:text-zinc-200 break-words"
      {...props}
    >
      {children}
    </h6>
  ),
  table: ({ node, children, ...props }) => (
    <div className="my-1.5 overflow-x-auto w-full max-w-full">
      <table
        className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700 black:divide-zinc-700 text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ node, children, ...props }) => (
    <thead
      className="bg-zinc-50 dark:bg-zinc-800/50 black:bg-zinc-800/50"
      {...props}
    >
      {children}
    </thead>
  ),
  tbody: ({ node, children, ...props }) => (
    <tbody
      className="divide-y divide-zinc-200 dark:divide-zinc-700 black:divide-zinc-700 bg-white dark:bg-transparent black:bg-transparent"
      {...props}
    >
      {children}
    </tbody>
  ),
  tr: ({ node, children, ...props }) => (
    <tr
      className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30 black:hover:bg-zinc-800/30"
      {...props}
    >
      {children}
    </tr>
  ),
  th: ({ node, children, ...props }) => (
    <th
      className="px-3 py-1.5 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 black:text-zinc-400 uppercase tracking-wider"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ node, children, ...props }) => (
    <td className="px-3 py-1.5 text-sm" {...props}>
      {children}
    </td>
  ),
  hr: ({ node, ...props }) => (
    <hr
      className="my-1.5 border-zinc-200 dark:border-zinc-700 black:border-zinc-700"
      {...props}
    />
  ),
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
