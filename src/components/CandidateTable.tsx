import React from 'react';
import type { Employee } from '../../types';
import { StatusBadge } from '../../components/admin/shared/Utils';
import { toCandidateTableRows, type CandidateTableRow } from '../lib/candidate-display';

interface CandidateTableProps {
  candidates: Employee[];
  onSelect?: (candidate: Employee) => void;
  onRecycle?: (candidate: Employee) => void;
  showSource?: boolean;
  showContact?: boolean;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  onSelect,
  onRecycle,
  showSource = true,
  showContact = false,
}) => {
  const rows = toCandidateTableRows(candidates);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-600 font-semibold">
          <tr>
            <th className="px-6 py-4">Nama Pelamar</th>
            <th className="px-6 py-4">Lowongan</th>
            {showContact && <th className="px-6 py-4">Email</th>}
            {showContact && <th className="px-6 py-4">WhatsApp</th>}
            <th className="px-6 py-4">Domisili</th>
            <th className="px-6 py-4">Pendidikan</th>
            <th className="px-6 py-4">Status</th>
            {showSource && <th className="px-6 py-4">Sumber</th>}
            <th className="px-6 py-4">Terdaftar</th>
            {(onSelect || onRecycle) && <th className="px-6 py-4 text-right">Tindakan</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={showContact ? 10 : 8}
                className="px-6 py-12 text-center text-slate-400 font-medium"
              >
                Kandidat tidak ditemukan.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <CandidateTableRowView
                key={row.id}
                row={row}
                candidate={candidates.find((c) => c.id === row.id)!}
                onSelect={onSelect}
                onRecycle={onRecycle}
                showSource={showSource}
                showContact={showContact}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

function CandidateTableRowView({
  row,
  candidate,
  onSelect,
  onRecycle,
  showSource,
  showContact,
}: {
  row: CandidateTableRow;
  candidate: Employee;
  onSelect?: (c: Employee) => void;
  onRecycle?: (c: Employee) => void;
  showSource: boolean;
  showContact: boolean;
}) {
  return (
    <tr className="hover:bg-slate-50/70 transition">
      <td className="px-6 py-4 font-semibold text-slate-800">{row.fullName}</td>
      <td className="px-6 py-4 text-slate-600">{row.positionApplied}</td>
      {showContact && <td className="px-6 py-4 text-slate-500">{row.email}</td>}
      {showContact && <td className="px-6 py-4 text-slate-500">{row.whatsappNumber}</td>}
      <td className="px-6 py-4 text-slate-500">{row.domicileCity}</td>
      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
        {row.lastEducation}
        {row.major !== '-' ? ` · ${row.major}` : ''}
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={row.status} />
      </td>
      {showSource && (
        <td className="px-6 py-4">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {row.source}
          </span>
        </td>
      )}
      <td className="px-6 py-4 text-xs text-slate-500">{row.createdAt}</td>
      {(onSelect || onRecycle) && (
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-3">
            {onRecycle && candidate.status === 'REJECTED' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRecycle(candidate);
                }}
                className="rounded bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-100"
              >
                Salurkan Ulang
              </button>
            )}
            {onSelect && (
              <button
                type="button"
                onClick={() => onSelect(candidate)}
                className="font-bold text-indigo-600 hover:text-indigo-800"
              >
                Detail
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}