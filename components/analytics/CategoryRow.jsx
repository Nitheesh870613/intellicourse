
import ProgressBar from "./ProgressBar";

export default function CategoryRow({ name, count, total, index = 0 }) {
    const percent = total ? Math.round((count / total) * 100) : 0;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-white">{name}</span>
                <span className="text-gray-400">{count}</span>
            </div>
            <ProgressBar value={percent} colorIndex={index} />
        </div>
    );
}
