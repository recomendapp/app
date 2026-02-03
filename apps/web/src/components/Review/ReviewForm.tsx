'use client'

import { Editor, EditorContent } from '@tiptap/react';
import { generateJSON } from '@tiptap/html'
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { MediaMovie, MediaTvSeries, UserReview } from '@recomendapp/types';
import { cn } from '@/lib/utils';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useEditor } from '@/components/tiptap/Tiptap';
import { upperFirst } from 'lodash';
import { useModal } from '@/context/modal-context';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { EDITOR_EXTENSIONS } from '../tiptap/TiptapExtensions';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { BoldIcon, ItalicIcon, LinkIcon, RedoIcon, StrikethroughIcon, UnderlineIcon, UndoIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { CardMovie } from '../Card/CardMovie';
import { CardTvSeries } from '../Card/CardTvSeries';
import ButtonUserActivityMovieRating from '../buttons/ButtonUserActivityMovieRating';
import ButtonUserActivityTvSeriesRating from '../buttons/ButtonUserActivityTvSeriesRating';
import { Spinner } from '../ui/spinner';

const MAX_TITLE_LENGTH = 50;
const MAX_BODY_LENGTH = 5000;

type EditorState = {
  canRedo: boolean;
  canUndo: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
};

interface ReviewFormBase extends React.HTMLAttributes<HTMLDivElement> {
	review?: UserReview;
	rating?: number;
	onUpdate?: (data: { title?: string; body: string }) => Promise<void>;
	onCreate?: (data: { title?: string; body: string }) => Promise<void>;
	onCancel?: () => void;
}

type ReviewMovie = {
	type: 'movie';
	movie: MediaMovie;
	tvSeries?: never;
}

type ReviewTvSeries = {
	type: 'tv_series';
	tvSeries: MediaTvSeries;
	movie?: never;
}

type ReviewFormProps = ReviewFormBase & (ReviewMovie | ReviewTvSeries);

export default function ReviewForm({
	review,
	rating,
	className,
	onUpdate,
	onCreate,
	onCancel,
	type,
	movie,
	tvSeries,
} : ReviewFormProps) {
	const t = useTranslations();
	const { createConfirmModal } = useModal();

	// Editor
	const [title, setTitle] = useState(review?.title);
	const [bodyLength, setBodyLength] = useState(0);
	const [editorState, setEditorState] = useState<EditorState | null>(null);
	const computeState = useCallback((editor: Editor): EditorState => ({
		canRedo: editor.can().redo(),
		canUndo: editor.can().undo(),
		bold: editor.isActive('bold'),
		italic: editor.isActive('italic'),
		underline: editor.isActive('underline'),
		strike: editor.isActive('strike'),
	}), []);
	const editor = useEditor(
		{
			editorProps: {
				attributes: {
				class: 'prose prose-sm sm:prose lg:prose-lg focus:outline-hidden',
				},
			},
			extensions: [
				CharacterCount.configure({ limit: MAX_BODY_LENGTH }),
				Placeholder.configure({ placeholder: 'Write your review here...' }),
			],
			content: review ? generateJSON(review?.body, EDITOR_EXTENSIONS) : undefined,
			onUpdate({ editor }) {
				setBodyLength(editor.storage.characterCount.characters());
				setEditorState(computeState(editor));
			},
			onCreate({ editor }) {
				setBodyLength(editor.storage.characterCount.characters());
				setEditorState(computeState(editor));
			},
		},
		[
			review?.body,
			computeState
		]
	);
	const now = useNow({ updateInterval: 1000 * 10 });
	const format = useFormatter();
	const [isLoading, setIsLoading] = useState(false);

	const handleUpdateReview = useCallback(async () => {
		try{
			setIsLoading(true);
			const body = editor?.getHTML();
			if (title == review?.title && body == review?.body) {
				// setEditable(false);
				return;
			}
			if (!body || bodyLength == 0) {
				toast.error('Le contenu est obligatoire');
				return;
			}

			await onUpdate?.({
				title: title?.trim(),
				body: body,
			});
			toast.success(upperFirst(t('common.messages.saved', { gender: 'male', count: 1 })));
		} catch (error) {
			toast.error(upperFirst(t('common.messages.an_error_occurred')));
		} finally {
			setIsLoading(false);
		}
	}, [bodyLength, editor, onUpdate, review?.body, review?.title, t, title]);

	const handleCreateReview = useCallback(async () => {
		try {
			setIsLoading(true);
			const body = editor?.getHTML();
			if (!rating) {
				toast.error(upperFirst(t('common.messages.a_rating_is_required_to_add_a_review')))
				return;
			}
			if (!body || bodyLength == 0) {
				toast.error(upperFirst(t('common.messages.review_cannot_be_empty')));
				return;
			}
	
			await onCreate?.({
				title: title?.trim(),
				body: body,
			});
			toast.success(upperFirst(t('common.messages.saved', { gender: 'male', count: 1 })));
		} finally {
			setIsLoading(false);
		}
	}, [bodyLength, editor, onCreate, rating, t, title]);

	const handleCancel = useCallback(() => {
		const body = editor?.getHTML();
		if (title !== review?.title || body !== review?.body) {
			createConfirmModal({
				title: upperFirst(t('common.messages.cancel_change', { count: 2 })),
				description: upperFirst(t('common.messages.do_you_really_want_to_cancel_change', { count: 2 })),
				onConfirm: () => {
					onCancel?.();
				}
			})
		} else {
			onCancel?.();
		}
	}, [title, review, editor, onCancel, createConfirmModal, t]);

	return (
		<Card className={cn("w-full max-w-4xl gap-4", className)}>
			<CardHeader>
				<CardTitle>
					{review ? upperFirst(t('common.messages.edit_review')) : upperFirst(t('common.messages.new_review'))}
				</CardTitle>
				<CardAction className='space-x-2'>
					{review && (
						<Button disabled={isLoading} variant="outline" onClick={handleCancel}>{upperFirst(t('common.messages.cancel'))}</Button>
					)}
					<Button disabled={isLoading} onClick={review ? handleUpdateReview : handleCreateReview}>
						{isLoading && <Spinner />}
						<span>
							{upperFirst(t('common.messages.save', { gender: 'male', count: 1 }))}
						</span>
					</Button>
				</CardAction>
			</CardHeader>
			<div className='flex flex-col items-center justify-center px-6 gap-2'>
				{type === 'movie' ? (
				<>
					<CardMovie movie={movie} linked={false} />
					<ButtonUserActivityMovieRating movieId={movie.id} />
				</>
				) : type === 'tv_series' && (
				<>
					<CardTvSeries tvSeries={tvSeries} linked={false} />
					<ButtonUserActivityTvSeriesRating tvSeriesId={tvSeries.id} />
				</>
				)}

			</div>
			<CardContent className='space-y-4'>
				<ReviewTitle title={title} setTitle={setTitle} />
				<InputGroup>
					<Toolbar editor={editor} editorState={editorState} />
					<EditorContent editor={editor} className='w-full px-4'/>
					<InputGroupAddon align={'block-end'} className='justify-end'>
						<InputGroupText className='text-muted-foreground text-xs'>
							{bodyLength} / {MAX_BODY_LENGTH}
						</InputGroupText>
					</InputGroupAddon>
				</InputGroup>
			</CardContent>
	 	</Card>
	);
}

const ReviewTitle = ({
  title,
  setTitle,
}: {
  title: string | null | undefined;
  setTitle: Dispatch<SetStateAction<string | null | undefined>>;
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef && textAreaRef.current) {
      textAreaRef.current.style.height = '0px';
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = scrollHeight + 'px';
    }
  }, [textAreaRef, title]);

  return (
	<InputGroup>
		<InputGroupTextarea
		ref={textAreaRef}
		onChange={(e) =>
			setTitle(e.target.value.replace(/\s+/g, ' ').trimStart())
		}
		value={title ?? ''}
		placeholder="Titre"
		maxLength={MAX_TITLE_LENGTH}
		className={`w-full h-fit  outline-hidden focus-visible:ring-0 overflow-hidden text-5xl! font-semibold text-center text-accent-yellow`}
		/>
		<InputGroupAddon align={'block-end'} className='justify-end'>
			<InputGroupText className='text-muted-foreground text-xs'>
				{(title ? title.length : 0)} / {MAX_TITLE_LENGTH}
			</InputGroupText>
		</InputGroupAddon>
	</InputGroup>
  );
};

const Toolbar = ({ editor, editorState }: { editor: Editor | null, editorState: EditorState | null }) => {
	const canRedo = useMemo(() => editorState?.canRedo ?? false, [editorState]);
	const canUndo = useMemo(() => editorState?.canUndo ?? false, [editorState]);
	return (
	<ScrollArea className='w-full'>
		<InputGroupAddon align={'block-start'}>
			<InputGroupButton
			variant={'outline'}
			size={'icon-sm'}
			onClick={() => editor?.chain().focus().undo().run()}
			disabled={!canUndo}
			>
				<UndoIcon size={15} />
			</InputGroupButton>
			<InputGroupButton
			variant={'outline'}
			size={'icon-sm'}
			onClick={() => editor?.chain().focus().redo().run()}
			disabled={!canRedo}
			>
				<RedoIcon size={15} />
			</InputGroupButton>
			<LinkAction editor={editor} />
			<InputGroupButton
			variant={editorState?.bold ? 'default' : 'outline'}
			size={'icon-sm'}
			onClick={() => editor?.chain().focus().toggleBold().run()}
			>
				<BoldIcon size={15} />
			</InputGroupButton>
			<InputGroupButton
			variant={editorState?.underline ? 'default' : 'outline'}
			size={'icon-sm'}
			onClick={() => editor?.chain().focus().toggleUnderline().run()}
			>
				<UnderlineIcon size={15} />
			</InputGroupButton>
			<InputGroupButton
			variant={editorState?.italic ? 'default' : 'outline'}
			size={'icon-sm'}
			onClick={() => editor?.chain().focus().toggleItalic().run()}
			>
				<ItalicIcon size={15} />
			</InputGroupButton>
			<InputGroupButton
			variant={editorState?.strike ? 'default' : 'outline'}
			size={'icon-sm'}
			onClick={() => editor?.chain().focus().toggleStrike().run()}
			>
				<StrikethroughIcon size={15} />
			</InputGroupButton>
		</InputGroupAddon>
		<ScrollBar orientation="horizontal" />
	</ScrollArea>
	);
};

const LinkAction = ({ editor }: { editor: Editor | null }) => {
	const t = useTranslations()
	const [open, setOpen] = useState(false);

	const saveLink = useCallback((e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		if (formData.get('link')) {
		editor
			?.chain()
			.focus()
			.extendMarkRange('link')
			.setLink({ href: String(formData.get('link')), target: '_blank' })
			.run();
		} else {
		editor?.chain().focus().extendMarkRange('link').unsetLink().run();
		}
	}, [editor]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<InputGroupButton variant={'outline'} size={'icon-sm'}>
					<LinkIcon size={15} />
				</InputGroupButton>
			</PopoverTrigger>
			<PopoverContent align="center">
				<form onSubmit={saveLink} className="flex items-center gap-2">
				<div className="flex flex-1 flex-col gap-2">
					<Label htmlFor="link" className="sr-only">
						{upperFirst(t('common.messages.link'))}
					</Label>
					<Input
					name="link"
					defaultValue={editor?.getAttributes('link').href}
					placeholder="https://..."
					className="max-w-[200px]"
					/>
				</div>
				<Button type="submit" size="sm">
					<span className="sr-only">{upperFirst(t('common.messages.save'))}</span>
					{/* <Icons. className="h-4 w-4" /> */}
				</Button>
				</form>
			</PopoverContent>
		</Popover>
	);
}

