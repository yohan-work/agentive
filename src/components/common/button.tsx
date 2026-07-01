import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "border-accent/30 bg-accent/15 text-primary hover:bg-accent/20",
  secondary: "border-line bg-elevated text-secondary hover:border-accent/35 hover:text-primary",
  ghost: "border-transparent bg-transparent text-secondary hover:bg-elevated hover:text-primary"
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "secondary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
};

export function ButtonLink({ href, children, variant = "secondary", className }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition",
        variants[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
