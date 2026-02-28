"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PaintBrush02Icon,
  CheckmarkCircle02Icon,
  LoadingIcon,
} from "@hugeicons/core-free-icons";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";

const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

type AppearanceFormData = z.infer<typeof appearanceSchema>;

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<AppearanceFormData>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: (theme as "light" | "dark" | "system") ?? "system",
    },
  });

  // لما يتغير theme خارجيًا نحدث الفورم
  useEffect(() => {
    if (theme) {
      reset({ theme: theme as "light" | "dark" | "system" });
    }
  }, [theme, reset]);

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setTheme(theme);
  };

  return (
    <div className="space-y-8">
      <FieldGroup className="space-y-6">
        <Field>
          <FieldLabel className="text-sm font-semibold flex items-center gap-2">
            <HugeiconsIcon icon={PaintBrush02Icon} size={16} />
            Theme
          </FieldLabel>

          <Controller
            name="theme"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-3">
                {["light", "dark", "system"].map((value) => {
                  const isActive = field.value === value;

                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() =>
                        handleThemeChange(value as "light" | "dark" | "system")
                      }
                      className={`
                        h-11 rounded-md border text-sm font-medium capitalize
                        transition-all
                        ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 hover:bg-muted border-border"
                        }
                      `}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            )}
          />

          <FieldDescription>
            Choose how the application looks to you. System will match your
            device settings.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </div>
  );
}
