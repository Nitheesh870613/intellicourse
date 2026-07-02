"use client";

export default function ProgressBar({ value = 0, color = "var(--accent-purple)", className = "" }) {
    const percentage = Math.min(100, Math.max(0, value));

    return (
        <div className={`w-full bg-[rgba(255,255,255,0.03)] h-2 rounded-full ${className}`}>
            <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, background: color }}
            />
        </div>
    );
}
