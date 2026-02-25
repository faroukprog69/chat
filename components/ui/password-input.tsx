"use client";

import * as React from "react";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ViewIcon,
  ViewOffSlashIcon,
  ShieldCheck,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils"; // للتأكد من دمج التنسيقات بشكل صحيح

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showIcon?: boolean;
  icon?: any;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, showIcon = true, icon, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-semibold mb-1.5 block">{label}</label>
        )}

        <div className="relative group">
          {showIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <HugeiconsIcon icon={icon || ShieldCheck} size={18} />
            </div>
          )}

          <Input
            {...props}
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={cn(
              "h-11 bg-muted/20 pr-10",
              showIcon && "pl-10",
              error && "border-destructive focus-visible:ring-destructive",
              className,
            )}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all p-1 rounded-md"
          >
            <HugeiconsIcon
              icon={showPassword ? ViewOffSlashIcon : ViewIcon}
              size={18}
            />
          </button>
        </div>

        {error && (
          <p className="text-xs text-destructive font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
