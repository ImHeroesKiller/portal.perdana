import React from 'react';
import type { JobVacancy } from '../../types';
import {
  getJobDisplayFields,
  inspectJobTitleSources,
  resolveJobTitle,
  type JobDisplayFields,
} from '../../lib/job-display';

export type { JobDisplayFields };

export interface JobListProps {
  jobs: JobVacancy[];
  source?: string;
  className?: string;
  showCount?: boolean;
  countLabel?: (count: number) => string;
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
  renderItem,
}) => {
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  if (safeJobs.length > 0) {
    const sample = safeJobs[0] as JobVacancy & Record<string, unknown>;
    console.log(`[JobList:${source}] sampleJobFull`, JSON.parse(JSON.stringify(sample)));
    console.log(`[JobList:${source}] titleSources`, inspectJobTitleSources(sample));
  }

  console.log(`[JobList:${source}] render`, {
    count: safeJobs.length,
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
    <div className={className} data-job-list={source} data-count={safeJobs.length}>
      {showCount && (
        <p className="mb-1 text-xs font-bold text-slate-500">{countLabel(safeJobs.length)}</p>
      )}
      {safeJobs.map((job, index) => {
        const display = getJobDisplayFields(job);
        const title = resolveJobTitle(job);
        const displayForRender: JobDisplayFields = { ...display, title };
        const key = resolveJobKey(displayForRender, index);

        if (index < 3) {
          console.log(`[JobList:${source}] renderItem`, {
            index,
            key,
            id: displayForRender.id,
            title,
            jobTitle: job.title,
            department: displayForRender.department,
            location: displayForRender.location,
            isActive: job.isActive,
          });
        }

        return (
          <div key={key} data-job-id={displayForRender.id || undefined} data-job-index={index}>
            {renderItem(job, displayForRender, index)}
          </div>
        );
      })}
    </div>
  );
};