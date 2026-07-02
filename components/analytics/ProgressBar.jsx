
export default function ProgressBar({ value, colorIndex = 0 }) {
    // Softer pastel colors matching dashboard
    const colors = ['#f5a962', '#5ee6b0', '#7dd3fc', '#f472b6', '#c084fc', '#a78bfa', '#4ade80', '#fbbf24', '#94a3b8', '#67e8f9'];
    const color = colors[colorIndex % colors.length];

    return (
        <div className="w-full h-2 rounded-full bg-white/10">
            <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${value}%`, backgroundColor: color }}
            />
        </div>
    );
}
