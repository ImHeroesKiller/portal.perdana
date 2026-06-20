import React, { useEffect } from 'react';
import type { JobVacancy } from '../../types';

export interface JobListProps {
  jobs: JobVacancy[];
  source?: string;
  children: (job: JobVacancy) => React.ReactNode;
}

/** Wrapper render daftar lowongan + debug log (empty state ditangani parent). */
export const JobList: React.FC<JobListProps> = ({
  jobs,
  source = 'JobList',
  children,
}) => {
  useEffect(() => {
    console.log(`[JobList:${source}]`, {
      count: jobs.length,
      sample: jobs.slice(0, 5).map((j) => ({ id: j.id, title: j.title, isActive: j.isActive })),
    });
  }, [jobs, source]);

  return <>{jobs.map((job) => children(job))}</>;
};