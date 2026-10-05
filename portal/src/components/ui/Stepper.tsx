'use client';

import React from 'react';

export interface Step {
  label: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export default function Stepper({ steps, currentStep, completedSteps }: StepperProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isActive = currentStep === index;

        return (
          <React.Fragment key={index}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-[#1B2A4A] text-white' : 'border-2 border-gray-300 text-gray-400 bg-white'}`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : isActive ? 'text-[#1B2A4A] font-bold' : 'text-gray-400'}`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-grow mx-4 border-t-2 border-dashed border-gray-300"></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
