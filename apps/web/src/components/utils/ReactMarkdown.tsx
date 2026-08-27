import { Link } from '@/lib/i18n/navigation';
import React from 'react';
import ReactMarkdownPrimitive from 'react-markdown';
import { buttonVariants } from '@libs/ui/components/button';
import { cn } from '@/lib/utils';

export const ReactMarkdown = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof ReactMarkdownPrimitive>
>(({ children, ...props }, ref) => {
  return (
    <ReactMarkdownPrimitive
      components={{
        a: ({ href = '', children }) => (
          <Link
            href={href}
            className={cn(buttonVariants({ variant: 'link' }), 'p-0 inline whitespace-normal')}
          >
            {children}
          </Link>
        ),
      }}
      {...props}
    >
      {children}
    </ReactMarkdownPrimitive>
  );
});
ReactMarkdown.displayName = 'ReactMarkdown';
