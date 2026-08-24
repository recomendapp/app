'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { importsListPaginatedOptions } from '@libs/query-client';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { ImporterInitiator } from './ImporterInitiator';
import { Modal } from '@/components/Modals/Modal';
import { useTranslations } from 'next-intl';
import { ImportJobRow } from './_components/ImportJobRow';
import { ImporterJobsPagination } from './_components/ImporterJobsPagination';

const JOBS_PER_PAGE = 10;

export type ImporterSource = {
  source: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  fileTypes: string;
};

export const IMPORTER_SOURCES: ImporterSource[] = [
  {
    source: 'letterboxd',
    name: 'Letterboxd',
    description: 'Import your data from Letterboxd',
    icon: 'letterboxd_vertical',
    enabled: true,
    fileTypes: 'zip, application/zip, application/x-zip-compressed, multipart/x-zip',
  },
  {
    source: 'recomend',
    name: 'Recomend',
    description: 'Import your data from Recomend',
    icon: 'recomend',
    enabled: false,
    fileTypes: 'json',
  },
  {
    source: 'senscritique',
    name: 'SensCritique',
    description: 'Import your data from SensCritique',
    icon: 'senscritique',
    enabled: false,
    fileTypes: 'json',
  },
  {
    source: 'csv',
    name: 'CSV',
    description: 'Import your data from a CSV file',
    icon: 'csv',
    enabled: false,
    fileTypes: 'csv',
  },
];

export function Importer() {
  const t = useTranslations();
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeJobId, setResumeJobId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const { data: jobsPage } = useQuery(
    importsListPaginatedOptions({ filters: { page, per_page: JOBS_PER_PAGE } }),
  );
  const jobs = jobsPage?.data;
  const activeJob = jobs?.find((job) =>
    (['pending', 'processing', 'awaiting_review'] as string[]).includes(job.status),
  );

  const openNew = () => {
    setResumeJobId(activeJob?.id ?? null);
    setModalOpen(true);
  };

  const openExisting = (jobId: number) => {
    setResumeJobId(jobId);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('pages.settings.data.importer.label')}</h3>
        <Button size="icon" variant="outline" onClick={openNew}>
          <PlusIcon size={16} />
        </Button>
      </div>

      {!jobs?.length ? (
        <p className="text-sm text-muted-foreground">{t('pages.settings.data.importer.empty')}</p>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <ImportJobRow key={job.id} job={job} onOpen={() => openExisting(job.id)} />
          ))}
        </div>
      )}

      {jobsPage && (
        <ImporterJobsPagination
          page={page}
          perPage={jobsPage.meta.per_page}
          total={jobsPage.meta.total_results}
          onPageChange={setPage}
        />
      )}

      <Modal open={modalOpen} onOpenChange={setModalOpen} className="flex flex-col sm:max-w-4xl">
        <ImporterInitiator
          key={modalOpen ? `open-${resumeJobId ?? 'new'}` : 'closed'}
          sources={IMPORTER_SOURCES}
          setModalOpen={setModalOpen}
          resumeJobId={resumeJobId ?? undefined}
        />
      </Modal>
    </div>
  );
}
