import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
	{
		variants: {
			variant: {
				default: "border-transparent bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900",
				secondary: "border-transparent bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
				outline: "text-neutral-900 dark:text-neutral-100",
				purple: "border-transparent bg-purple-600 text-white dark:bg-violet-600",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => (
	<div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
))
Badge.displayName = "Badge"

export { Badge, badgeVariants }

// commit for changes












