'use client';

import React, { useState, useRef } from 'react';

export interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

export default function FileUpload({
  onFileSelect,
  accept = '.pdf',
  maxSizeMB = 10,
  label,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    if (accept) {
      const allowedExtensions = accept.split(',').map((ext) => ext.trim().toLowerCase());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      const isValid = allowedExtensions.some(ext => {
        if (ext.startsWith('.')) return fileExtension === ext;
        return file.type.match(new RegExp(ext.replace('*', '.*')));
      });

      if (!isValid) {
        setError(`Invalid file type. Accepted formats: ${accept}`);
        setSelectedFile(null);
        onFileSelect(null);
        return;
      }
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full mb-4">
      {label && <label className="block font-semibold text-sm text-gray-700 mb-1">{label}</label>}
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-[#1B2A4A] bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />
        
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center">
            <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 font-medium">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-500 mt-1">(File size Limit : {maxSizeMB}MB)</p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
            <div className="flex items-center truncate">
              <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 truncate">{selectedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="ml-4 text-red-500 hover:text-red-700 focus:outline-none p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
