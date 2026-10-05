'use client';

import React from 'react';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label: string;
  required?: boolean;
  error?: string;
  as?: 'input' | 'textarea' | 'select';
  options?: { label: string; value: string }[];
  rows?: number;
}

export default function FormField({
  label,
  required,
  error,
  as = 'input',
  options = [],
  className,
  ...props
}: FormFieldProps) {
  const baseClassName = `border rounded-md px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#1B2A4A] focus:border-[#1B2A4A] ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${className || ''}`;

  return (
    <div className="flex flex-col mb-4 w-full">
      <label className="font-semibold text-sm text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {as === 'textarea' ? (
        <textarea
          className={baseClassName}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : as === 'select' ? (
        <select
          className={baseClassName}
          {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
        >
          <option value="" disabled hidden>
            {props.placeholder || 'Select an option'}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={baseClassName}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
}
