'use client';

import React, { useState, useMemo } from 'react';

export interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
}

export interface DataTableProps {
  columns: Column[];
  data: any[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export default function DataTable({
  columns,
  data,
  searchable = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data to display',
}: DataTableProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    if (!searchable || !search) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter((item) => {
      return Object.values(item).some(
        (val) => val && String(val).toLowerCase().includes(lowerSearch)
      );
    });
  }, [data, search, searchable]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  return (
    <div className="flex flex-col w-full">
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-[#1B2A4A]"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
      
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#F9FAFB]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {col.render ? col.render(item[col.key], item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-gray-500">
                  <span className="font-bold">{emptyMessage}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-sm font-medium text-[#1B2A4A] disabled:text-gray-400"
          >
            &lt; Previous
          </button>
          <span className="text-sm text-gray-700 border px-3 py-1 rounded-md bg-gray-50">
            {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="text-sm font-medium text-[#1B2A4A] disabled:text-gray-400"
          >
            Next &gt;
          </button>
        </div>
      )}
    </div>
  );
}
