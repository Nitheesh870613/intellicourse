import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-[#14151C] dark:bg-[#14151C]", className)}
            {...props}
        />
    )
}

export { Skeleton }
