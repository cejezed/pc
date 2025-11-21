// src/Components/ui/button.tsx
import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zeus-primary)] focus-visible:ring-offset-2 ring-offset-[var(--zeus-bg)] " +
  "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary button - Zeus Primary met glow
        default:
          "bg-[var(--zeus-primary)] hover:bg-[var(--zeus-primary-dark)] text-white shadow-[0_4px_15px_var(--zeus-primary-glow)] hover:shadow-[0_0_20px_var(--zeus-primary-glow)]",

        // Destructive - Rood met witte tekst
        destructive:
          "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20",

        // Outline - Border en donkere tekst
        outline:
          "border border-[var(--zeus-border)] bg-[var(--zeus-card)] hover:bg-[var(--zeus-card-hover)] hover:border-[var(--zeus-primary)] text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)]",

        // Secondary - Donkerder achtergrond
        secondary:
          "bg-[var(--zeus-bg-secondary)] hover:bg-[var(--zeus-card-hover)] text-[var(--zeus-text)] border border-[var(--zeus-border)]",

        // Ghost - Transparant met hover effect
        ghost:
          "bg-transparent hover:bg-[var(--zeus-card-hover)] text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)]",

        // Link - Zoals een link
        link:
          "bg-transparent text-[var(--zeus-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };