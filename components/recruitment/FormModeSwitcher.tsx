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
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Metode lamaran
          </p>
          <p className="mt-0.5 text-sm font-black text-slate-900">PT Perdana Adi Yuda</p>
        </div>
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
                    ? 'border-[#003087] text-white shadow-md ring-1 ring-cyan-400/30'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#003087]/25 hover:bg-slate-50/80'
                }`}
                style={active ? { backgroundColor: BRAND_NAVY } : undefined}
              >
                <span className="block text-xs font-black">{tab.label}</span>
                <span className={`block text-[10px] ${active ? 'text-cyan-100' : 'text-slate-400'}`}>
                  {tab.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}