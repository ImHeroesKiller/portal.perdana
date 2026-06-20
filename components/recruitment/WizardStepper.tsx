import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { BRAND_NAVY } from '../home/homeContent';

type StepDef = { id: number; title: string; icon: React.ComponentType<{ className?: string }> };

export function WizardStepper({
  steps,
  currentStep,
}: {
  steps: StepDef[];
  currentStep: number;
}) {
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-4 sm:px-6">
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
                className={`mb-1 flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                  active
                    ? 'border-[#003087] bg-[#003087] text-white'
                    : done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-200 bg-white'
                }`}
              >
                {done ? (
                  <CheckIcon className="h-4 w-4 stroke-[3]" aria-hidden />
                ) : (
                  <Icon className={`h-4 w-4 ${active ? 'stroke-[2.5]' : ''}`} aria-hidden />
                )}
              </span>
              <span className="hidden text-[10px] font-bold sm:block">{step.title}</span>
            </div>
          );
        })}
      </div>
      <div className="mx-auto mt-3 h-1.5 max-w-2xl overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: BRAND_NAVY }}
        />
      </div>
      <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] font-semibold text-slate-500">
        Langkah {currentStep} dari {steps.length}
      </p>
    </div>
  );
}