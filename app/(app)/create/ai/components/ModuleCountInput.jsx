"use client";
import { Minus, Plus } from "lucide-react";

export default function ModuleCountInput({ value, onChange, min = 1, max = 20 }) {
    const decrement = () => onChange(Math.max(min, value - 1));
    const increment = () => onChange(Math.min(max, value + 1));

    return (
        <div className="flex items-center gap-3 mt-3">
            <button
                onClick={decrement}
                className="w-10 h-10 flex items-center justify-center bg-[#14151C] border border-white/10 rounded-xl text-white hover:border-[#9B6BFF] transition"
            >
                <Minus size={18} />
            </button>

            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => {
                    const newValue = Number(e.target.value);
                    if (newValue >= min && newValue <= max) {
                        onChange(newValue);
                    }
                }}
                className="w-20 text-center bg-[#14151C] border border-white/10 rounded-xl px-3 py-2 text-white focus:border-[#9B6BFF] outline-none"
            />

            <button
                onClick={increment}
                className="w-10 h-10 flex items-center justify-center bg-[#14151C] border border-white/10 rounded-xl text-white hover:border-[#9B6BFF] transition"
            >
                <Plus size={18} />
            </button>
        </div>
    );
}
