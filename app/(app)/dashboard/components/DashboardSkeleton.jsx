import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[#0f0f17]">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-8 w-64" />
                    </div>
                    <Skeleton className="h-10 w-56 rounded-xl" />
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Large Analytics Card Skeleton */}
                    <div className="col-span-8">
                        <Card className="h-full">
                            <div className="flex gap-8">
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-40 mb-2" />
                                    <Skeleton className="h-10 w-32 mb-8" />

                                    <div className="space-y-5">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <Skeleton className="h-4 w-28" />
                                                <Skeleton className="h-4 w-10" />
                                                <Skeleton className="h-2 flex-1 rounded-full" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-center">
                                    <Skeleton className="w-[180px] h-[180px] rounded-full" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Side Cards Skeleton */}
                    <div className="col-span-4 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <Skeleton className="h-5 w-32 mb-1" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                </div>
                                <Skeleton className="h-4 w-12 mb-3" />
                                <Skeleton className="h-2 w-full rounded-full" />
                            </Card>
                        ))}
                    </div>

                    {/* Stats Cards Skeleton */}
                    <div className="col-span-12 grid grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="p-5">
                                <Skeleton className="h-3 w-24 mb-2" />
                                <div className="flex items-baseline gap-2 mb-4">
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-3 w-8" />
                                </div>
                                <div className="h-12 flex items-end gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                                        <Skeleton key={j} className="flex-1 rounded-t" style={{ height: `${Math.random() * 50 + 20}%` }} />
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
