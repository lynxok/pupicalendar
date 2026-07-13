import * as React from "react";
import { cn } from "@/src/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[32px] border border-natural-card-border bg-white p-6 shadow-sm transition-all duration-300",
        glass && "bg-white/40 backdrop-blur-md border-white/30",
        "hover:shadow-md hover:border-natural-accent/20",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-natural-text text-white hover:opacity-90 shadow-sm',
      accent: 'bg-natural-accent text-white hover:opacity-90 shadow-sm',
      secondary: 'bg-natural-bg text-natural-accent hover:bg-natural-border/50',
      ghost: 'hover:bg-natural-bg text-natural-text/60 hover:text-natural-text',
      outline: 'border border-natural-border bg-transparent hover:bg-natural-bg text-natural-text/80',
      danger: 'bg-rose-500 text-white hover:bg-rose-600',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
