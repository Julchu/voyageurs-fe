import { type ButtonHTMLAttributes, forwardRef } from "react";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
  }
>(({ children, className, ...props }, ref) => {
  return (
    <button
      {...props}
      ref={ref}
      className={`inline-flex items-center justify-center text-white shadow transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${className ?? ""}`}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";
