'use client'

import './Tiptap.css';
import { DependencyList } from 'react';
import { useEditor as useEditorBase, UseEditorOptions } from '@tiptap/react';
import { EDITOR_EXTENSIONS } from './TiptapExtensions';

export const useEditor = (options?: UseEditorOptions | undefined, deps?: DependencyList) => {
  return useEditorBase(
    {
      ...options,
      immediatelyRender: options?.immediatelyRender ?? false,
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose lg:prose-lg focus:outline-hidden',
        },
        ...options?.editorProps,
      },
      extensions: [
        ...EDITOR_EXTENSIONS,
        ...(options?.extensions || []),
      ],
    },
    deps
  );
};