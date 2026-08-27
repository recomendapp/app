'use client';

import { Input } from '@libs/ui/components/input';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ImporterSource } from './Importer';
import { Button } from '@libs/ui/components/button';
import { CheckCircle2Icon, Loader2Icon, UploadIcon, XCircleIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import {
  importOptions,
  useImportCreateMutation,
  useImportValidateMutation,
} from '@libs/query-client';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import Markdown from 'react-markdown';
import { ImageWithFallback } from '@/components/utils/ImageWithFallback';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@libs/ui/components/accordion';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@libs/ui/components/breadcrumb';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@libs/ui/components/select';
import { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/Modals/Modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@libs/ui/components/alert-dialog';

import { ImporterCategoryList, ReviewCategory } from './_components/ImporterCategoryList';
import { ReviewCategoryLogMovies } from './_components/ReviewCategoryLogMovies';
import { ReviewCategoryLogTvSeries } from './_components/ReviewCategoryLogTvSeries';
import { ReviewCategoryBookmarks } from './_components/ReviewCategoryBookmarks';
import { ReviewCategoryPlaylists } from './_components/ReviewCategoryPlaylists';

type Step = 'select-file' | 'processing' | 'review' | 'success' | 'failed';

const CATEGORY_TITLE_KEY: Record<ReviewCategory, string> = {
  'log-movies': 'pages.settings.data.importer.categories.log_movies',
  'log-tv-series': 'pages.settings.data.importer.categories.log_tv_series',
  bookmarks: 'pages.settings.data.importer.categories.bookmarks',
  playlists: 'pages.settings.data.importer.categories.playlists',
};

export const ImporterInitiator = ({
  sources,
  setModalOpen,
  resumeJobId,
}: {
  sources: ImporterSource[];
  setModalOpen: (open: boolean) => void;
  resumeJobId?: number;
}) => {
  const t = useTranslations();
  const { theme } = useTheme();
  const [selectedSource, setSelectedSource] = useState<ImporterSource | null>(null);
  const [step, setStep] = useState<Step>(resumeJobId ? 'processing' : 'select-file');
  const [jobId, setJobId] = useState<number | null>(resumeJobId ?? null);
  const [reviewCategory, setReviewCategory] = useState<ReviewCategory | null>(null);
  const [playlistId, setPlaylistId] = useState<number | null>(null);
  const [playlistTitle, setPlaylistTitle] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const backToCategories = () => {
    setReviewCategory(null);
    setPlaylistId(null);
    setPlaylistTitle(null);
  };

  const backToPlaylists = () => {
    setPlaylistId(null);
    setPlaylistTitle(null);
  };

  const createMutation = useImportCreateMutation();
  const isUploading = createMutation.isPending;
  const validateMutation = useImportValidateMutation();
  const { data: job } = useQuery({
    ...importOptions(jobId ?? 0),
    enabled: !!jobId && (step === 'processing' || step === 'review'),
  });

  useEffect(() => {
    if (!job) return;
    if (job.status === 'awaiting_review') setStep('review');
    else if (job.status === 'failed') setStep('failed');
    else if (job.status === 'completed') setStep('success');
  }, [job]);

  const handleFileSelected = (file: File) => {
    if (!selectedSource) return;
    createMutation.mutate(
      { file, provider: selectedSource.source as 'letterboxd' | 'senscritique' | 'recomend' },
      {
        onSuccess: (data) => {
          setJobId(data.id);
          setStep('processing');
        },
        onError: () => {
          toast.error(t('pages.settings.data.importer.upload_error'));
        },
      },
    );
  };

  const handleFilesSelected = (fileList: FileList) => {
    if (!selectedSource || fileList.length === 0 || isUploading) return;

    if (fileList.length > 1) {
      toast.error(t('pages.settings.data.importer.invalid_file_type'));
      return;
    }

    const file = fileList[0];
    const acceptedExtensions = selectedSource.fileTypes.filter((type) => !type.includes('/'));
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !acceptedExtensions.includes(extension)) {
      toast.error(t('pages.settings.data.importer.invalid_file_type'));
      return;
    }

    handleFileSelected(file);
  };

  const handleClose = () => setModalOpen(false);

  const title =
    step === 'select-file'
      ? t('pages.settings.data.importer.select_source')
      : step === 'processing'
        ? t('pages.settings.data.importer.processing')
        : step === 'review'
          ? reviewCategory
            ? (playlistTitle ?? t(CATEGORY_TITLE_KEY[reviewCategory]))
            : t('pages.settings.data.importer.review_title')
          : step === 'success'
            ? t('pages.settings.data.importer.success_title')
            : t('pages.settings.data.importer.failed_title');

  return (
    <>
      <ModalHeader>
        {step === 'review' && reviewCategory ? (
          <>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button type="button" onClick={backToCategories}>
                      {t('pages.settings.data.importer.review_title')}
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {playlistId ? (
                    <BreadcrumbLink asChild>
                      <button type="button" onClick={backToPlaylists}>
                        {t(CATEGORY_TITLE_KEY[reviewCategory])}
                      </button>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{t(CATEGORY_TITLE_KEY[reviewCategory])}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {playlistId && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="truncate max-w-[200px]">
                        {playlistTitle}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
            <ModalTitle className="sr-only">{title}</ModalTitle>
          </>
        ) : (
          <ModalTitle>{title}</ModalTitle>
        )}
      </ModalHeader>

      <ModalBody className="flex-1 overflow-y-auto">
        {step === 'select-file' && (
          <div className="flex flex-col gap-3">
            {!selectedSource ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {sources
                  .sort((a, b) => (a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1))
                  .map((source) => (
                    <Button
                      variant="outline"
                      key={source.source}
                      disabled={!source.enabled}
                      onClick={() => setSelectedSource(source)}
                      className="relative flex flex-col items-center gap-2 aspect-square h-full overflow-hidden"
                    >
                      <ImageWithFallback
                        src={theme === 'dark' ? source.iconDark : source.iconLight}
                        alt={source.name}
                        fill
                        sizes={`
													(max-width: 640px) 48px,
													(max-width: 1024px) 64px,
													80px
												`}
                        type="service"
                      />
                    </Button>
                  ))}
              </div>
            ) : (
              <Select
                value={selectedSource.source}
                onValueChange={(value) => {
                  const source = sources.find((source) => source.source === value);
                  if (source) setSelectedSource(source);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('pages.settings.data.importer.select_source')} />
                </SelectTrigger>
                <SelectContent>
                  {sources
                    .sort((a, b) => (a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1))
                    .map((source) => (
                      <SelectItem
                        value={source.source}
                        key={source.source}
                        disabled={!source.enabled}
                      >
                        {source.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}

            {selectedSource?.instructions && (
              <Accordion type="single" collapsible className="rounded-md border px-4">
                <AccordionItem value="instructions" className="border-none">
                  <AccordionTrigger>
                    {t('pages.settings.data.importer.instructions_title')}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                      <Markdown
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {selectedSource.instructions}
                      </Markdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {selectedSource && (
              <div
                className={cn(
                  'flex flex-col gap-2 text-center justify-center min-h-32 px-4 py-4 transition bg-background border-2 border-dashed rounded-md appearance-none',
                  isDraggingOver ? 'border-accent-yellow' : 'border-muted',
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (isUploading) return;
                  if (!isDraggingOver) setIsDraggingOver(true);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsDraggingOver(false);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  if (isUploading) return;
                  if (e.dataTransfer.files?.length) handleFilesSelected(e.dataTransfer.files);
                }}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2Icon className="animate-spin text-muted-foreground" size={20} />
                    <span className="text-sm text-muted-foreground">
                      {t('pages.settings.data.importer.uploading')}
                    </span>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <UploadIcon className="text-muted-foreground" size={24} />
                    <span className="font-medium text-muted-foreground">
                      {t.rich('pages.settings.data.importer.browse_prompt', {
                        link: (chunks) => (
                          <span className="text-accent-yellow underline">{chunks}</span>
                        ),
                      })}
                    </span>
                    <Input
                      type="file"
                      name="file"
                      className="hidden"
                      disabled={isUploading}
                      accept={selectedSource.fileTypes.join(',')}
                      onChange={(e) => {
                        if (e.target.files?.length) handleFilesSelected(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <Loader2Icon className="animate-spin text-muted-foreground" size={32} />
          </div>
        )}

        {step === 'review' && jobId && !reviewCategory && (
          <ImporterCategoryList jobId={jobId} onSelect={setReviewCategory} />
        )}
        {step === 'review' && jobId && reviewCategory === 'log-movies' && (
          <ReviewCategoryLogMovies jobId={jobId} />
        )}
        {step === 'review' && jobId && reviewCategory === 'log-tv-series' && (
          <ReviewCategoryLogTvSeries jobId={jobId} />
        )}
        {step === 'review' && jobId && reviewCategory === 'bookmarks' && (
          <ReviewCategoryBookmarks jobId={jobId} />
        )}
        {step === 'review' && jobId && reviewCategory === 'playlists' && (
          <ReviewCategoryPlaylists
            jobId={jobId}
            playlistId={playlistId}
            onSelectPlaylist={(id, title) => {
              setPlaylistId(id);
              setPlaylistTitle(title);
            }}
          />
        )}

        {step === 'success' && (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <CheckCircle2Icon className="text-accent-green" size={32} />
            <span className="text-sm text-muted-foreground">
              {t('pages.settings.data.importer.success_description')}
            </span>
          </div>
        )}

        {step === 'failed' && (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <XCircleIcon className="text-destructive" size={32} />
            {job?.error && <span className="text-sm text-muted-foreground">{job.error}</span>}
          </div>
        )}
      </ModalBody>

      {step === 'review' && jobId && !reviewCategory && (
        <ModalFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" disabled={validateMutation.isPending}>
                {validateMutation.isPending && (
                  <Loader2Icon size={16} className="mr-2 animate-spin" />
                )}
                {t('pages.settings.data.importer.validate')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('common.messages.are_u_sure')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('pages.settings.data.importer.validate_confirm_description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.messages.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    validateMutation.mutate({ id: jobId }, { onSuccess: () => setStep('success') })
                  }
                >
                  {t('common.messages.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ModalFooter>
      )}

      {(step === 'success' || step === 'failed') && (
        <ModalFooter>
          <Button
            className="w-full"
            variant={step === 'failed' ? 'outline' : 'default'}
            onClick={handleClose}
          >
            {t(step === 'success' ? 'common.messages.continue' : 'common.messages.cancel')}
          </Button>
        </ModalFooter>
      )}
    </>
  );
};
