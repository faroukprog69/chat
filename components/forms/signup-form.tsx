"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInviteCode, validateInviteCode } from "@/app/actions/auth";
import { bufferToBase64 } from "@/lib/crypto/encoding";
import { deriveMasterKey } from "@/lib/crypto/deriveKey";
import {
  exportKeyJWK,
  generateIdentityKeys,
} from "@/lib/crypto/generateKeyPair";
import { encryptData } from "@/lib/crypto/encrypt";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PasswordInput } from "../ui/password-input";

// Zod schema for validation
const signupSchema = z
  .object({
    name: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(
        /^[a-zA-Z0-9_\.]+$/,
        "Username can only contain letters, numbers, underscores, and periods",
      ),
    displayName: z.string().min(1, "Display Name is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z
      .string()
      .min(8, "Confirm Password must be at least 8 characters"),
    inviteCode: z.string().min(1, "Invite Code is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [isLoding, setIsLoding] = useState(false);
  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    defaultValues: {
      name: "",
      displayName: "",
      password: "",
      confirmPassword: "",
      inviteCode: "",
    },
    resolver: zodResolver(signupSchema),
  });

  const router = useRouter();

  const handleSignup = async (data: SignupFormData) => {
    setIsLoding(true);
    try {
      // 1. تحقق من كود الدعوة (Server-side)
      const inviteCheck = await validateInviteCode(data.inviteCode);
      if (!inviteCheck.success) {
        toast.error(inviteCheck.error);
        return;
      }

      // 2. توليد Salt عشوائي
      const saltBuffer = window.crypto.getRandomValues(new Uint8Array(16));
      const saltBase64 = bufferToBase64(saltBuffer.buffer);

      // 3. اشتقاق الـ Master Key من كلمة السر
      const masterKey = await deriveMasterKey(data.password, saltBase64);

      // 4. توليد مفتاح الهوية (ECDH)
      const keyPair = await generateIdentityKeys();
      const publicKeyJWK = await exportKeyJWK(keyPair.publicKey);
      const privateKeyJWK = await exportKeyJWK(keyPair.privateKey);

      // 5. تشفير المفتاح الخاص
      const encryptedPriv = await encryptData(
        JSON.stringify(privateKeyJWK),
        masterKey,
      );

      const encryptedPrivateKeyStr = JSON.stringify({
        ciphertext: bufferToBase64(encryptedPriv.ciphertext),
        iv: bufferToBase64(encryptedPriv.iv.buffer),
      });

      // 6. التسجيل في Better Auth
      const user = await authClient.signUp.email({
        email: `${data.name}@internal.chat`,
        password: data.password,
        name: data.name.toLowerCase(),
        displayName: data.displayName,
        callbackURL: "/chat",
        publicKey: JSON.stringify(publicKeyJWK),
        encryptedPrivateKey: encryptedPrivateKeyStr,
        kdfSalt: saltBase64,
      });
      if (user.error) {
        toast.error(user.error.message);
        setIsLoding(false);
        return;
      }
      // useInviteCode(data.inviteCode);
      // Success
      toast.success("Account successfully created!");
      router.push("/chat");
    } catch (err) {
      console.error("Error:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoding(false);
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleSignup)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Username</FieldLabel>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      id="name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter your username"
                    />
                    {fieldState.invalid && (
                      <FieldDescription className="text-red-500">
                        {fieldState.error?.message}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
              <Controller
                name="displayName"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      id="displayName"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter your display name"
                    />
                    {fieldState.invalid && (
                      <FieldDescription className="text-red-500">
                        {fieldState.error?.message}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            </Field>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <PasswordInput
                  {...field}
                  label="Password"
                  error={errors.password?.message}
                  placeholder="Enter your password"
                  showIcon={false}
                  className="h-8"
                />
              )}
            />

            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      id="confirm-password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Confirm your password"
                    />
                    {fieldState.invalid && (
                      <FieldDescription className="text-red-500">
                        {fieldState.error?.message}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="invite-code">Invite Code</FieldLabel>
              <Controller
                name="inviteCode"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      id="invite-code"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter your invite code"
                    />
                    {fieldState.invalid && (
                      <FieldDescription className="text-red-500">
                        {fieldState.error?.message}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            </Field>

            <Field>
              <Button disabled={isLoding} type="submit">
                {isLoding ? "Creating account..." : "Create Account"}
              </Button>
              <FieldDescription className="px-6 text-center">
                Already have an account? <Link href="/signin">Sign in</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
