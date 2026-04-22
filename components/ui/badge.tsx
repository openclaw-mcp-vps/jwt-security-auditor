import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-slate-700 bg-slate-800 text-slate-200",
        critical: "border-rose-400/50 bg-rose-500/15 text-rose-300",
        high: "border-orange-400/50 bg-orange-500/15 text-orange-300",
        medium: "border-amber-400/50 bg-amber-500/15 text-amber-300",
        low: "border-sky-400/50 bg-sky-500/15 text-sky-300",
        info: "border-teal-400/50 bg-teal-500/15 text-teal-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
