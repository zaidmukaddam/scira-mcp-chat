/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link";
import React, { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const components: Partial<Components> = {
  pre: ({ children, ...props }) => (
    <pre className="overflow-x-auto rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-4 my-2 text-sm" {...props}>
      {children}
    </pre>
  ),
  code: ({ children, className, ...props }: React.HTMLProps<HTMLElement> & { className?: string }) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match && !className;

    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 text-[0.9em] font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn("block font-mono text-sm", className)} {...props}>
        {children}
      </code>
    );
  },
  ol: ({ node, children, ...props }) => (
    <ol className="list-decimal list-outside ml-4 space-y-1 my-2" {...props}>
      {children}
    </ol>
  ),
  ul: ({ node, children, ...props }) => (
    <ul className="list-disc list-outside ml-4 space-y-1 my-2" {...props}>
      {children}
    </ul>
  ),
  li: ({ node, children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  p: ({ node, children, ...props }) => (
    <p className="leading-7" {...props}>
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
      className="border-l-2 border-zinc-200 dark:border-zinc-700 pl-4 my-3 italic text-zinc-600 dark:text-zinc-400"
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({ node, children, ...props }) => (
    // @ts-expect-error error
    <Link
      className="text-blue-500 hover:underline hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      {children}
    </Link>
  ),
  h1: ({ node, children, ...props }) => (
    <h1 className="text-3xl font-semibold mt-6 mb-4 text-zinc-800 dark:text-zinc-200" {...props}>
      {children}
    </h1>
  ),
  h2: ({ node, children, ...props }) => (
    <h2 className="text-2xl font-semibold mt-6 mb-3 text-zinc-800 dark:text-zinc-200" {...props}>
      {children}
    </h2>
  ),
  h3: ({ node, children, ...props }) => (
    <h3 className="text-xl font-semibold mt-6 mb-3 text-zinc-800 dark:text-zinc-200" {...props}>
      {children}
    </h3>
  ),
  h4: ({ node, children, ...props }) => (
    <h4 className="text-lg font-semibold mt-6 mb-2 text-zinc-800 dark:text-zinc-200" {...props}>
      {children}
    </h4>
  ),
  h5: ({ node, children, ...props }) => (
    <h5 className="text-base font-semibold mt-6 mb-2 text-zinc-800 dark:text-zinc-200" {...props}>
      {children}
    </h5>
  ),
  h6: ({ node, children, ...props }) => (
    <h6 className="text-sm font-semibold mt-6 mb-2 text-zinc-800 dark:text-zinc-200" {...props}>
      {children}
    </h6>
  ),
  table: ({ node, children, ...props }) => (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ node, children, ...props }) => (
    <thead className="bg-zinc-50 dark:bg-zinc-800/50" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ node, children, ...props }) => (
    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-transparent" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ node, children, ...props }) => (
    <tr className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30" {...props}>
      {children}
    </tr>
  ),
  th: ({ node, children, ...props }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ node, children, ...props }) => (
    <td className="px-4 py-3 text-sm" {...props}>
      {children}
    </td>
  ),
  hr: ({ node, ...props }) => (
    <hr className="my-4 border-zinc-200 dark:border-zinc-700" {...props} />
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
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);