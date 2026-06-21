import React from 'react';
import { DocumentArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { FileState } from '../../types/recruitment-form';
import type { FieldErrors } from '../../lib/recruitment-validation';
import { StepHeader } from './recruitmentUi';

interface Props {
  files: FileState;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: keyof FileState) => void;
  fieldErrors?: FieldErrors;
}

const DOC_FIELDS: {
  key: keyof FileState;
  label: string;
  required: boolean;
  hint?: string;
}[] = [
  { key: 'applicationLetter', label: 'Surat Lamaran', required: true },
  { key: 'cv', label: 'CV / Resume', required: true },
  { key: 'ktp', label: 'KTP', required: true },
  { key: 'photo', label: 'Foto Diri', required: true, hint: 'Foto formal, latar polos' },
  { key: 'kk', label: 'Kartu Keluarga (KK)', required: false },
  { key: 'diploma', label: 'Ijazah / Transkrip', required: false },
  { key: 'certificate', label: 'Sertifikat Keahlian', required: false },
];

export const StepDocuments: React.FC<Props> = ({ files, onFileChange, fieldErrors = {} }) => (
  <div className="animate-fade-in space-y-6">
    <StepHeader
      step={4}
      title="Unggah Dokumen"
      subtitle="Format PDF, JPG, atau PNG. Maksimal 5 MB per file."
    />

    <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3.5 text-sm text-amber-900">
      <strong>Wajib:</strong> Surat Lamaran, CV, KTP, dan Foto Diri. Dokumen lain sangat disarankan untuk mempercepat proses screening.
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {DOC_FIELDS.map(({ key, label, required, hint }) => (
        <FileInput
          key={key}
          label={label}
          required={required}
          hint={hint}
          file={files[key]}
          error={fieldErrors[key]}
          onChange={(e) => onFileChange(e, key)}
        />
      ))}
    </div>
  </div>
);

function FileInput({
  label,
  required,
  hint,
  file,
  error,
  onChange,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  file: File | null;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const id = React.useId();
  const hasFile = Boolean(file);

  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        error
          ? 'border-red-300 bg-red-50/30'
          : hasFile
            ? 'border-[#003087]/25 bg-blue-50/40'
            : 'border-slate-200 bg-white hover:border-[#003087]/20'
      }`}
    >
      <label htmlFor={id} className="mb-2 flex cursor-pointer items-center gap-2 text-sm font-black text-slate-900">
        {hasFile ? (
          <CheckCircleIcon className="h-5 w-5 text-emerald-600" aria-hidden />
        ) : (
          <DocumentArrowUpIcon className="h-5 w-5 text-[#003087]" aria-hidden />
        )}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      {hasFile && (
        <p className="mb-2 truncate text-xs font-medium text-[#003087]">{file!.name}</p>
      )}
      <input
        id={id}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={onChange}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#003087] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-blue-900"
      />
      {error && (
        <p className="mt-2 text-xs font-medium text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}