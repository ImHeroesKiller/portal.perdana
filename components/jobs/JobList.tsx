import React from 'react';
import type { JobVacancy } from '../../types';
import { getJobDisplayFields, type JobDisplayFields } from '../../lib/job-display';

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

/** Render daftar lowongan — key = job.id, log di setiap render item */
export const JobList: React.FC<JobListProps> = ({
  jobs,
  source = 'JobList',
  className = 'space-y-4',
  showCount = false,
  countLabel = defaultCountLabel,
  renderItem,
}) => {
  console.log(`[JobList:${source}] render`, {
    count: jobs.length,
    ids: jobs.slice(0, 8).map((j) => j.id),
  });

  if (!Array.isArray(jobs) || jobs.length === 0) {
    console.log(`[JobList:${source}] skip — jobs kosong`);
    return null;
  }

  return (
    <div className={className} data-job-list={source} data-count={jobs.length}>
      {showCount && (
        <p className="mb-1 text-xs font-bold text-slate-500">{countLabel(jobs.length)}</p>
      )}
      {jobs.map((job, index) => {
        const display = getJobDisplayFields(job);
        const key = resolveJobKey(display, index);

        console.log(`[JobList:${source}] renderItem`, {
          index,
          key,
          id: display.id,
          title: display.title || job.title,
          department: display.department || job.department,
          location: display.location || job.location,
          rawTitle: job.title,
          isActive: job.isActive,
        });

        return (
          <div key={key} data-job-id={display.id || undefined} data-job-index={index}>
            {renderItem(job, display, index)}
          </div>
        );
      })}
    </div>
  );
};