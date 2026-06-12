// src/components/ui/avatar.tsx

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fallback?: string;
}

const SIZE_CLASSES = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
};

const SIZE_PX = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };

export function Avatar({ src, alt, size = "md", fallback, className, ...props }: AvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const px = SIZE_PX[size];
  const initials = fallback ?? alt.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0",
        sizeClass,
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={px}
          height={px}
          className="object-cover w-full h-full"
        />
      ) : (
        <span className="font-semibold text-primary select-none">{initials}</span>
      )}
    </div>
  );
}
