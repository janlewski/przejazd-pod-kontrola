import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        // Domain variants (railway signage). Shape glyphs carry meaning besides colour.
        p1: "rounded-sm border-signal bg-signal font-mono text-signal-foreground",
        p2: "rounded-sm border-warning bg-warning font-mono text-warning-foreground",
        p3: "rounded-sm border-ok bg-card font-mono text-ok",
        unassessed: "rounded-sm border-dashed border-line-strong bg-transparent font-mono text-muted-foreground",
        v1: "rounded-sm border-foreground bg-foreground font-mono text-background",
        v2: "rounded-sm border-foreground bg-card font-mono text-foreground",
        v3: "rounded-sm border-line-strong bg-card font-mono text-muted-foreground",
        plate: "size-6 rounded-sm border-2 border-foreground bg-card p-0 font-mono text-[13px] font-semibold text-foreground",
        fictional: "rounded-none border-dashed border-foreground bg-card font-mono text-[10px] tracking-[0.14em] text-foreground uppercase",
        quiet: "rounded-sm border-line-strong bg-card text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
