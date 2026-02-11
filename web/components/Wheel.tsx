"use client";

import React from "react";
import { getCoordinatesForPercent } from "@/lib/wheelMath";

export type WheelVariant = "multi" | "mono";

interface WheelProps {
    slots: { label: string }[];
    rotation: number;
    isSpinning: boolean;
    onSpinEnd?: () => void;
    variant?: WheelVariant;
    monoColor?: string;
    className?: string;
}

const DEFAULT_COLORS = [
    "#f87171", // red-400
    "#fb923c", // orange-400
    "#facc15", // yellow-400
    "#a3e635", // lime-400
    "#4ade80", // green-400
    "#2dd4bf", // teal-400
    "#38bdf8", // sky-400
    "#818cf8", // indigo-400
    "#c084fc", // purple-400
    "#f472b6", // pink-400
];

const Wheel: React.FC<WheelProps> = ({
    slots,
    rotation,
    isSpinning,
    onSpinEnd,
    variant = "multi",
    monoColor = "#6366f1",
    className = "",
}) => {
    const slotCount = Math.max(slots.length, 1); // Avoid division by zero

    // Handle transition end
    const handleTransitionEnd = () => {
        if (isSpinning && onSpinEnd) {
            onSpinEnd();
        }
    };

    return (
        <div className={`relative aspect-square w-full max-w-[480px] mx-auto ${className}`}>
            {/* Pointer (Triangle) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 pointer-events-none">
                <svg viewBox="0 0 24 24" fill="currentColor" className="text-gray-800 drop-shadow-lg">
                    <path d="M12 22L2 2h20L12 22z" />
                </svg>
            </div>

            {/* Wheel SVG */}
            <div
                className="w-full h-full rounded-full overflow-hidden shadow-xl border-4 border-white bg-white box-border"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? "transform 3s cubic-bezier(0.2, 0.8, 0.3, 1)" : "none",
                }}
                onTransitionEnd={handleTransitionEnd}
            >
                <svg
                    viewBox="-1 -1 2 2"
                    className="w-full h-full"
                    style={{ transform: "rotate(-90deg)" }} // Start specific alignment if needed
                >
                    {slots.map((slot, index) => {
                        // Calculate segment arc
                        const startPercent = index / slotCount;
                        const endPercent = (index + 1) / slotCount;

                        const [startX, startY] = getCoordinatesForPercent(startPercent);
                        const [endX, endY] = getCoordinatesForPercent(endPercent);

                        const largeArcFlag = 1 / slotCount > 0.5 ? 1 : 0;

                        const pathData = [
                            `M 0 0`,
                            `L ${startX} ${startY}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                            `Z`,
                        ].join(" ");

                        // Colors logic
                        const fillColor =
                            variant === "mono" ? monoColor : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                        const strokeColor = variant === "mono" ? "#ffffff" : "transparent"; // Lines in mono
                        const textColor = variant === "mono" ? "#ffffff" : "#1f2937"; // White text on mono

                        // Text transform
                        const midPercent = (startPercent + endPercent) / 2;
                        const [midX, midY] = getCoordinatesForPercent(midPercent);
                        const rotationAngle = (midPercent * 360);

                        return (
                            <g key={index}>
                                <path
                                    d={pathData}
                                    fill={fillColor}
                                    stroke={strokeColor}
                                    strokeWidth={variant === "mono" ? "0.02" : "0"}
                                />
                                <text
                                    x={midX * 0.65}
                                    y={midY * 0.65}
                                    fill={textColor}
                                    fontSize="0.08"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    transform={`rotate(${rotationAngle}, ${midX * 0.65}, ${midY * 0.65})`}
                                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                                >
                                    {slot.label.length > 8 ? slot.label.substring(0, 8) + "..." : slot.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default Wheel;
