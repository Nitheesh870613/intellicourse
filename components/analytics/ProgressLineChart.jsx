'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProgressLineChart({ data }) {
    const chartData = data && data.length > 0 ? data : [];
    const isEmpty = chartData.length === 0;

    if (isEmpty) {
        return (
            <div className="h-[260px] w-full rounded-xl border border-dashed border-white/10 bg-[#0f111a] flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-10 w-10 text-gray-500 mb-3 opacity-50">
                    {/* Simple Line Chart Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-white">No learning activity yet</p>
                <p className="text-xs text-gray-400 mt-1">Complete modules to see your progress</p>
            </div>
        );
    }

    return (
        <div className="h-[260px] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        allowDecimals={false}
                    />
                    <Tooltip
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                        contentStyle={{ backgroundColor: '#1c1c29', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="modules"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#0f111a', stroke: '#22c55e', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#22c55e' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
