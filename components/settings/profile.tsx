"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserEditIcon,
  InformationCircleIcon,
  CheckmarkCircle02Icon,
  LoadingIcon,
  IdentityCardIcon,
} from "@hugeicons/core-free-icons";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCryptoStore } from "@/store/useCryptoStore";

const changeDisplayNameSchema = z
  .object({
    displayName: z
      .string()
      .min(1, "Display name is required")
      .max(50, "Display name must be less than 50 characters"),
  })
  .refine((data) => data.displayName.length >= 2, {
    message: "Display name must be at least 2 characters",
    path: ["displayName"],
  });

type ChangeDisplayNameFormData = z.infer<typeof changeDisplayNameSchema>;

interface Props {
  user: {
    name: string;
    displayName: string | null;
  };
}

export function ProfileForm({ user }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const setDisplayName = useCryptoStore((s) => s.setDisplayName);

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<ChangeDisplayNameFormData>({
    resolver: zodResolver(changeDisplayNameSchema),
    defaultValues: {
      displayName: user.displayName ?? "",
    },
  });

  const onSubmit = async (data: ChangeDisplayNameFormData) => {
    setIsLoading(true);
    const { error } = await authClient.updateUser({
      displayName: data.displayName,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    toast.success("Display name updated successfully");
    setIsLoading(false);
    setDisplayName(data.displayName);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <FieldGroup className="space-y-6">
        {/* Username - Read Only */}
        <Field>
          <FieldLabel className="text-sm font-semibold flex items-center gap-2">
            <HugeiconsIcon icon={IdentityCardIcon} size={16} />
            Username
          </FieldLabel>
          <Input
            value={user.name}
            disabled
            className="bg-muted/50 border-muted-foreground/10 text-muted-foreground cursor-not-allowed h-11"
          />
          <FieldDescription className="flex items-center gap-1.5 mt-2">
            <HugeiconsIcon icon={InformationCircleIcon} size={14} />
            Usernames are unique and cannot be changed.
          </FieldDescription>
        </Field>

        {/* Display Name - Editable */}

        <Field>
          <FieldLabel className="text-sm font-semibold flex items-center gap-2">
            <HugeiconsIcon icon={UserEditIcon} size={16} />
            Display Name
          </FieldLabel>
          <Controller
            name="displayName"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  placeholder="How should we call you?"
                  className="h-11 focus:ring-1 focus:ring-primary/40 transition-all"
                />
                {fieldState.invalid && (
                  <FieldDescription className="text-red-500">
                    {fieldState.error?.message}
                  </FieldDescription>
                )}
              </>
            )}
          />
          <FieldDescription>
            This is your public name shown in chats.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isLoading || !isDirty}
          className="w-full sm:w-auto min-w-[140px] h-11 gap-2 shadow-sm"
        >
          {isLoading ? (
            <HugeiconsIcon
              icon={LoadingIcon}
              className="animate-spin"
              size={20}
            />
          ) : (
            <>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
