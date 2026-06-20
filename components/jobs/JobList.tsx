import React, { useMemo } from 'react';
import type { JobVacancy } from '../../types';
import {
  getJobDisplayFields,
  inspectJobTitleSources,
  resolveJobTitle,
  type JobDisplayFields,
} from '../../lib/job-display';
import { BRAND_NAVY } from '../home/homeContent';
import { JobListPagination, VACANCIES_PAGE_SIZE } from './JobListPagination';

export type { JobDisplayFields };

export interface JobListPaginationConfig {
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export interface JobListProps {
  jobs: JobVacancy[];
  source?: string;
  className?: string;
  showCount?: boolean;
  countLabel?: (count: number) => string;
  pagination?: JobListPaginationConfig;
  renderItem: (job: JobVacancy, display: JobDisplayFields, index: number) => React.ReactNode;
}

const defaultCountLabel = (count: number) =>
  count === 1 ? '1 lowongan ditemukan' : `${count} lowongan ditemukan`;

function resolveJobKey(display: JobDisplayFields, index: number): string {
  if (display.id) return display.id;
  return `job-index-${index}`;
}

/** Render daftar lowongan — key = job.id, log sample job lengkap */
export const JobList: React.FC<JobListProps> = ({
  jobs,
  source = 'JobList',
  className = 'space-y-4',
  showCount = false,
  countLabel = defaultCountLabel,
  pagination,
  renderItem,
}) => {
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const pageSize = pagination?.pageSize ?? VACANCIES_PAGE_SIZE;
  const currentPage = pagination?.page ?? 1;

  const displayJobs = useMemo(() => {
    if (!pagination) return safeJobs;
    const start = (currentPage - 1) * pageSize;
    return safeJobs.slice(start, start + pageSize);
  }, [safeJobs, pagination, currentPage, pageSize]);

  if (safeJobs.length > 0) {
    const sample = safeJobs[0] as JobVacancy & Record<string, unknown>;
    console.log(`[JobList:${source}] sampleJobFull`, JSON.parse(JSON.stringify(sample)));
    console.log(`[JobList:${source}] titleSources`, inspectJobTitleSources(sample));
  }

  console.log(`[JobList:${source}] render`, {
    count: safeJobs.length,
    page: currentPage,
    pageSize,
    displayed: displayJobs.length,
    ids: safeJobs.slice(0, 8).map((j) => j.id),
    sample: safeJobs.slice(0, 3).map((j) => ({
      id: j.id,
      jobTitle: j.title,
      resolvedTitle: resolveJobTitle(j),
      department: j.department,
      isActive: (j as { isActive?: unknown }).isActive,
    })),
  });

  if (safeJobs.length === 0) {
    console.log(`[JobList:${source}] skip — jobs kosong`);
    return null;
  }

  return (
    <div data-job-list={source} data-count={safeJobs.length}>
      {showCount && (
        <div
          className="mb-3 inline-flex items-center rounded-full border border-[#003087]/15 bg-blue-50 px-3 py-1.5"
          style={{ color: BRAND_NAVY }}
        >
          <p className="text-xs font-bold">{countLabel(safeJobs.length)}</p>
        </div>
      )}

      <div className={className}>
        {displayJobs.map((job, index) => {
          const display = getJobDisplayFields(job);
          const title = resolveJobTitle(job);
          const displayForRender: JobDisplayFields = { ...display, title };
          const globalIndex = pagination ? (currentPage - 1) * pageSize + index : index;
          const key = resolveJobKey(displayForRender, globalIndex);

          if (index < 3) {
            console.log(`[JobList:${source}] renderItem`, {
              index: globalIndex,
              key,
              id: displayForRender.id,
              title,
              jobTitle: job.title,
              department: displayForRender.department,
              location: displayForRender.location,
              type: displayForRender.type,
              isActive: job.isActive,
            });
          }

          return (
            <div key={key} data-job-id={displayForRender.id || undefined} data-job-index={globalIndex}>
              {renderItem(job, displayForRender, globalIndex)}
            </div>
          );
        })}
      </div>

      {pagination && (
        <JobListPagination
          page={currentPage}
          pageSize={pageSize}
          totalItems={safeJobs.length}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
};