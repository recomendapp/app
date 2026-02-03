import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Link from '@tiptap/extension-link';
import Bold from '@tiptap/extension-bold';
import Underline from '@tiptap/extension-underline';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import History from '@tiptap/extension-history';
import BubbleMenu from '@tiptap/extension-bubble-menu';

export const EDITOR_EXTENSIONS = [
  Document,
  History,
  Paragraph,
  Text,
  Link.configure({
    openOnClick: false,
  }),
  Bold,
  Underline,
  Italic,
  Strike,
  BubbleMenu,
];
