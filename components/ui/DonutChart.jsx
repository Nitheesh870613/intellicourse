"use client";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DonutChart({ data, size = 180 }) {
    const chartData = {
        labels: data.labels || [],
        datasets: [{
            data: data.values || [],
            backgroundColor: data.colors || ['#FFA066', '#9B6BFF', '#FF6AC1', '#6F85FF'],
            borderWidth: 0,
            cutout: '65%',
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
        },
    };

    return (
        <div style={{ width: size, height: size }}>
            <Doughnut data={chartData} options={options} />
        </div>
    );
}
