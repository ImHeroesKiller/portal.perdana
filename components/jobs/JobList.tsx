import React, { useEffect } from 'react';
import type { JobVacancy } from '../../types';
import { getJobDisplayFields, getJobKey } from '../../lib/job-display';

export interface JobListProps {
  jobs: JobVacancy[];
  source?: string;
  className?: string;
  /** Tampilkan jumlah di atas list */
  showCount?: boolean;
  countLabel?: (count: number) => string;
  renderItem: (job: JobVacancy, display: JobDisplayFields, index: number) => React.ReactNode;
}

const defaultCountLabel = (count: number) =>
  count === 1 ? '1 lowongan ditemukan' : `${count} lowongan ditemukan`;

/** Render daftar lowongan dengan key stabil + debug log */
export const JobList: React.FC<JobListProps> = ({
  jobs,
  source = 'JobList',
  className = 'space-y-4',
  showCount = false,
  countLabel = defaultCountLabel,
  renderItem,
}) => {
  useEffect(() => {
    console.log(`[JobList:${source}]`, {
      count: jobs.length,
      sample: jobs.slice(0, 3).map((j, i) => {
        const d = getJobDisplayFields(j);
        return { key: getJobKey(j, i), id: d.id, title: d.title, department: d.department };
      }),
    });
  }, [jobs, source]);

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className={className} data-job-list={source} data-count={jobs.length}>
      {showCount && (
        <p className="mb-1 text-xs font-bold text-slate-500">{countLabel(jobs.length)}</p>
      )}
      {jobs.map((job, index) => {
        const display = getJobDisplayFields(job);
        return (
          <React.Fragment key={getJobKey(job, index)}>
            {renderItem(job, display, index)}
          </React.Fragment>
        );
      })}
    </div>
  );
};