import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-sans font-semibold uppercase tracking-[0.16em] transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "rounded-[2px] bg-gold text-base hover:bg-beige",
        outline:
          "rounded-[2px] border border-foreground/25 text-foreground hover:border-gold hover:text-gold",
        ghost: "rounded-[2px] text-muted hover:text-foreground",
        link: "link-underline p-0 text-gold hover:text-beige",
      },
      size: {
        default: "h-12 px-7 text-[0.7rem]",
        sm: "h-10 px-5 text-[0.66rem]",
        lg: "h-14 px-10 text-[0.74rem]",
        icon: "size-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
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
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
