"use client";

import { cn } from "@/lib/utils";

export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[#1c1c29] border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div
      className={cn("p-6 pb-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }) {
  return (
    <h3
      className={cn("text-lg font-semibold text-white", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "", ...props }) {
  return (
    <p
      className={cn("text-sm text-white/60 mt-1", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div
      className={cn("p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...props }) {
  return (
    <div
      className={cn("p-6 pt-0 flex items-center", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Default export for backwards compatibility with default imports
export default Card;
