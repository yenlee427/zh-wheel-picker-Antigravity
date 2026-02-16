"use client";

import React from "react";
import { SpeedLevel } from "@/lib/typing/types";

type SpeedSelectorProps = {
  value: SpeedLevel;
  disabled?: boolean;
  onChange: (value: SpeedLevel) => void;
};

const SPEED_OPTIONS: SpeedLevel[] = [1, 2, 3, 4, 5];

export default function SpeedSelector({
  value,
  disabled = false,
  onChange,
}: SpeedSelectorProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-700">遊戲速度</legend>
      <div className="grid grid-cols-5 gap-2">
        {SPEED_OPTIONS.map((level) => (
          <button
            key={level}
            type="button"
            disabled={disabled}
            onClick={() => onChange(level)}
            className={`rounded-md border px-2 py-2 text-sm font-medium transition-colors ${
              value === level
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            aria-pressed={value === level}
          >
            L{level}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

