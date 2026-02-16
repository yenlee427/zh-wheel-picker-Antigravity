"use client";

import React from "react";

type WordGridEditorProps = {
  words: string[];
  disabled?: boolean;
  onChange: (index: number, value: string) => void;
};

export default function WordGridEditor({
  words,
  disabled = false,
  onChange,
}: WordGridEditorProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">生詞題庫</h3>
        <p className="text-xs text-gray-500">共 {words.length} 題</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
        {words.map((word, index) => (
          <label key={index} className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400 w-7 text-right">
              {index + 1}
            </span>
            <input
              type="text"
              value={word}
              disabled={disabled}
              onChange={(event) => onChange(index, event.target.value)}
              placeholder={`生詞 ${index + 1}`}
              className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

