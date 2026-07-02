'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function CategoryDonut({ data }) {
    const chartData = data && data.length > 0 ? data : [];
    const totalCourses = chartData.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const isEmpty = chartData.length === 0;

    // Dashboard color palette - softer pastel colors matching dashboard pie chart
    const COLORS = ['#f5a962', '#5ee6b0', '#7dd3fc', '#c084fc', '#f472b6', '#a78bfa', '#4ade80', '#fbbf24', '#94a3b8', '#67e8f9'];

    if (isEmpty) {
        return (
            <div className="h-[260px] w-full rounded-xl border border-dashed border-white/10 bg-[#0f111a] flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-10 w-10 text-gray-500 mb-3 opacity-50">
                    {/* Simple Pie Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-white">No activity yet</p>
                <p className="text-xs text-gray-400 mt-1">Start a course to see categories</p>
            </div>
        );
    }

    return (
        <div className="h-[260px] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="40%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1c1c29', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', paddingLeft: '20px', top: '40px' }}
                        formatter={(value) => <span style={{ color: '#ffffff' }}>{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
