'use client';

import React, { useRef, useEffect } from 'react';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleChange();
  };

  const handleChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden flex flex-col focus-within:ring-1 focus-within:ring-[#1B2A4A] focus-within:border-[#1B2A4A]">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-300">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1 rounded hover:bg-gray-200 font-bold"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1 rounded hover:bg-gray-200 italic"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1 rounded hover:bg-gray-200 underline"
          title="Underline"
        >
          U
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1 rounded hover:bg-gray-200"
          title="Bullet List"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1 rounded hover:bg-gray-200"
          title="Numbered List"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01" />
          </svg>
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[150px] outline-none relative"
        onInput={handleChange}
        onBlur={handleChange}
      />
      <style jsx>{`
        div[contentEditable]:empty:before {
          content: '${placeholder || ''}';
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
      `}</style>
    </div>
  );
}
