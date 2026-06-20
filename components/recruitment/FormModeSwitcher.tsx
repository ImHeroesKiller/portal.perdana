import React from 'react';
import { BRAND_NAVY } from '../home/homeContent';

export type ApplyFormMode = 'manual' | 'ai' | 'google_form';

export function FormModeSwitcher({
  mode,
  onChange,
  showGoogleForm,
}: {
  mode: ApplyFormMode;
  onChange: (mode: ApplyFormMode) => void;
  showGoogleForm?: boolean;
}) {
  const tabs: { id: ApplyFormMode; label: string; hint: string }[] = [
    { id: 'manual', label: 'Form Manual', hint: 'Wizard 4 langkah' },
    { id: 'ai', label: 'AI Sara', hint: 'Chat interaktif' },
  ];

  if (showGoogleForm) {
    tabs.push({ id: 'google_form', label: 'Google Form', hint: 'Form resmi' });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium text-slate-600">
        Pilih cara melamar di <strong className="text-slate-800">PT Perdana Adi Yuda</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`rounded-xl border px-3.5 py-2.5 text-left transition active:scale-[0.98] ${
                active
                  ? 'border-[#003087] text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-[#003087]/25'
              }`}
              style={active ? { backgroundColor: BRAND_NAVY } : undefined}
            >
              <span className="block text-xs font-extrabold">{tab.label}</span>
              <span className={`block text-[10px] ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                {tab.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}