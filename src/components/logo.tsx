
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-8 w-8", className)}
  >
    <path d="M8 18V6" />
    <path d="M12 18V6" />
    <path d="M16 18V6" />
    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    <path d="M22 12c0 4.4-3.6 8-8 8" />
  </svg>
);

    