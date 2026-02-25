"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Imports for Hugeicons
import {
  ShieldUserIcon,
  CheckmarkCircle02Icon,
  LoadingIcon,
  AccessIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { deriveMasterKey } from "@/lib/crypto/deriveKey";
import { decryptData } from "@/lib/crypto/decrypt";
import { encryptData } from "@/lib/crypto/encrypt";
import { base64ToBuffer, bufferToBase64 } from "@/lib/crypto/encoding";
import { PasswordInput } from "../ui/password-input";

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (formData: ChangePasswordFormData) => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.changePassword({
        newPassword: formData.password,
        currentPassword: formData.oldPassword,
        revokeOtherSessions: true,
      });

      if (error) throw new Error(error.message);

      const user = data?.user as any;
      const oldMasterKey = await deriveMasterKey(
        formData.oldPassword,
        user.kdfSalt,
      );
      const encryptedData = JSON.parse(user.encryptedPrivateKey);

      const decryptedJWKString = await decryptData(
        base64ToBuffer(encryptedData.ciphertext),
        oldMasterKey,
        new Uint8Array(base64ToBuffer(encryptedData.iv)),
      );

      if (!decryptedJWKString) throw new Error("Failed to decrypt private key");

      const newMasterKey = await deriveMasterKey(
        formData.password,
        user.kdfSalt,
      );
      const encryptedPriv = await encryptData(decryptedJWKString, newMasterKey);

      const encryptedPrivateKeyStr = JSON.stringify({
        ciphertext: bufferToBase64(encryptedPriv.ciphertext),
        iv: bufferToBase64(encryptedPriv.iv.buffer),
      });

      await authClient.updateUser({
        encryptedPrivateKey: encryptedPrivateKeyStr,
      });

      toast.success("Security updated successfully");
      reset();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup className="space-y-5">
        {/* Current Password */}
        <Controller
          name="oldPassword"
          control={control}
          render={({ field }) => (
            <PasswordInput
              {...field}
              label="Current Password"
              placeholder="Enter your current password"
              error={errors.oldPassword?.message}
              icon={AccessIcon}
            />
          )}
        />

        <div className="relative m-0">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
            <span className="bg-card px-2">New Credentials</span>
          </div>
        </div>

        {/* New Password */}
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordInput
              {...field}
              label="Password"
              placeholder="Enter your new password"
              error={errors.password?.message}
              icon={ShieldUserIcon}
            />
          )}
        />

        {/* Confirm Password */}
        <Field>
          <FieldLabel className="text-sm font-semibold mb-1.5">
            Confirm Password
          </FieldLabel>
          <div className="relative">
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type={showNewPassword ? "text" : "password"}
                  className="h-11 bg-muted/20"
                  placeholder="Repeat new password"
                />
              )}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive mt-1 font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        className="w-full h-11 gap-2 shadow-sm"
        disabled={isLoading}
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
            Update Password
          </>
        )}
      </Button>
    </form>
  );
}
