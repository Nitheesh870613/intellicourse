
export default function MetricCard({ label, value }) {
    return (
        <div className="rounded-xl border border-white/10 bg-[#0f111a] p-5">
            <p className="text-sm text-gray-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        </div>
    );
}
