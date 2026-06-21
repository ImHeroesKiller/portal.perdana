import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

type StepDef = { id: number; title: string; icon: React.ComponentType<{ className?: string }> };

export function WizardStepper({
  steps,
  currentStep,
}: {
  steps: StepDef[];
  currentStep: number;
}) {
  const progress = (currentStep / steps.length) * 100;
  const currentTitle = steps.find((s) => s.id === currentStep)?.title ?? '';

  return (
    <div className="border-b border-slate-100/90 bg-gradient-to-b from-slate-50/60 to-white px-6 py-5 sm:px-8">
      <div className="mx-auto flex max-w-2xl justify-between gap-1">
        {steps.map((step) => {
          const Icon = step.icon;
          const active = currentStep === step.id;
          const done = currentStep > step.id;

          return (
            <div
              key={step.id}
              className={`flex min-w-0 flex-1 flex-col items-center text-center ${
                active ? 'text-[#003087]' : done ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <span
                className={`mb-1.5 flex h-10 w-10 items-center justify-center rounded-full border-2 transition duration-300 ${
                  active
                    ? 'border-[#003087] bg-[#003087] text-white shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                    : done
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                      : 'border-slate-200 bg-white'
                }`}
              >
                {done ? (
                  <CheckIcon className="h-4 w-4 stroke-[3]" aria-hidden />
                ) : (
                  <Icon className={`h-4 w-4 ${active ? 'stroke-[2.5]' : ''}`} aria-hidden />
                )}
              </span>
              <span
                className={`line-clamp-1 text-[10px] font-bold ${
                  active ? 'text-[#003087]' : ''
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-4 h-1.5 max-w-2xl overflow-hidden rounded-full bg-slate-200/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#003087] via-blue-700 to-cyan-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mx-auto mt-2.5 max-w-2xl text-center text-[11px] font-semibold text-slate-500">
        Langkah{' '}
        <span className="font-black text-[#003087]">{currentStep}</span>
        {' '}dari {steps.length}
        {currentTitle && (
          <>
            {' '}
            — <span className="text-cyan-700">{currentTitle}</span>
          </>
        )}
      </p>
    </div>
  );
}