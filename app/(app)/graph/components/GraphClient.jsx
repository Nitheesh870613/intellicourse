'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Share2, X, BookOpen, Layers, FileText, HelpCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import ForceGraph2D
const ForceGraph2D = dynamic(
    () => import('react-force-graph-2d'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#9B6BFF] animate-spin" />
            </div>
        )
    }
);

// Constants
const NODE_COLORS = {
    course: '#9B6BFF',
    module: '#6B8BFF',
    chapter: '#57D1FF',
    quiz: '#FF6BD9',
};

const NODE_SIZES = {
    course: 18,
    module: 14,
    chapter: 10,
    quiz: 10,
};

export default function GraphClient({ initialData }) {
    const [graphData, setGraphData] = useState(initialData || { nodes: [], links: [] });
    const [selectedNode, setSelectedNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const graphRef = useRef();

    // Stats derived from data
    const stats = {
        totalCourses: initialData?.nodes.filter(n => n.type === 'course').length || 0,
        totalNodes: initialData?.nodes.length || 0,
    };

    // Handle resize
    useEffect(() => {
        const updateDimensions = () => {
            const panelWidth = selectedNode ? 384 : 0;
            setDimensions({
                width: window.innerWidth - panelWidth,
                height: window.innerHeight
            });
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [selectedNode]);

    // Handle node click
    const handleNodeClick = useCallback(async (node) => {
        setSelectedNode(node);
        // Log activity logic...
    }, []);

    // Canvas rendering
    const paintNode = useCallback((node, ctx, globalScale) => {
        const label = node.label || '';
        const fontSize = Math.max(10 / globalScale, 3);
        const nodeRadius = NODE_SIZES[node.type] || 10;
        const color = NODE_COLORS[node.type] || '#9B6BFF';

        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (globalScale > 0.5) {
            ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            const maxLen = 18;
            const displayLabel = label.length > maxLen ? label.slice(0, maxLen) + '…' : label;
            ctx.fillText(displayLabel, node.x, node.y + nodeRadius + 4);
        }
    }, []);

    const closePanel = () => setSelectedNode(null);

    // Detail Panel Logic (Simplified for brevity in artifact, assumes implementation generic)
    const renderNodeDetails = () => {
        if (!selectedNode) return null;
        const { type, data, label } = selectedNode;
        // ... (Keep existing detailed render logic)
        return (
            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    {/* ... Icon logic ... */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${NODE_COLORS[type]}20` }}>
                        <span className="text-white text-xs">{type[0].toUpperCase()}</span>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-white/40">{type}</p>
                        <h3 className="text-lg font-semibold text-white">{label}</h3>
                    </div>
                </div>
                {/* ... existing fields ... */}
                {type === 'course' && data && (
                    <Link href={`/course/${data.courseId}`} className="block w-full py-3 text-center rounded-xl bg-[#9B6BFF] text-white">Open Course</Link>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0f0f17] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 z-10 px-6 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#1c1c29] border border-white/10">
                            <Share2 className="w-6 h-6 text-[#9B6BFF]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Knowledge Graph</h1>
                            <p className="text-sm text-white/50">{stats.totalCourses} courses · {stats.totalNodes} nodes</p>
                        </div>
                    </div>
                    <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-[#1c1c29] border border-white/10 text-white/60 hover:text-white transition-colors">Back to Dashboard</Link>
                </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 left-6 z-10 p-4 rounded-2xl bg-[#1c1c29] border border-white/10 text-white">
                <p className="text-xs text-white/40 mb-2 uppercase">Legend</p>
                {Object.entries(NODE_COLORS).map(([t, c]) => (
                    <div key={t} className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} /> <span className="text-xs capitalize">{t}</span></div>
                ))}
            </div>

            <div className="w-full h-screen">
                {graphData.nodes.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-white/50">No Data</div>
                ) : (
                    <ForceGraph2D
                        ref={graphRef}
                        graphData={graphData}
                        nodeCanvasObject={paintNode}
                        onNodeClick={handleNodeClick}
                        linkColor={() => 'rgba(155, 107, 255, 0.25)'}
                        linkWidth={1.5}
                        backgroundColor="#0f0f17"
                        width={dimensions.width}
                        height={dimensions.height}
                        cooldownTicks={100}
                    />
                )}
            </div>

            {selectedNode && (
                <div className="absolute right-0 top-0 h-full w-96 bg-[#1c1c29] border-l border-white/10 p-6 z-20">
                    <div className="flex justify-between mb-4"><h2 className="text-white font-bold">Details</h2><button onClick={closePanel}><X className="text-white" /></button></div>
                    {renderNodeDetails()}
                </div>
            )}
        </div>
    );
}
