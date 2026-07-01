import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-panel/72 shadow-sm transition hover:border-accent/30 hover:bg-elevated/82",
        className
      )}
      {...props}
    />
  );
}
