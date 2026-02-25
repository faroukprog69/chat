"use client";

import { cn } from "@/lib/utils";
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
import { authClient } from "@/lib/auth-client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCryptoStore } from "@/store/useCryptoStore";
import { deriveMasterKey } from "@/lib/crypto/deriveKey";
import { decryptData } from "@/lib/crypto/decrypt";
import { base64ToBuffer } from "@/lib/crypto/encoding";
import { useRouter } from "next/navigation";
import { PasswordInput } from "../ui/password-input";

const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-zA-Z0-9_\.]+$/,
      "Username can only contain letters, numbers, underscores, and periods",
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoding, setIsLoding] = useState(false);
  const setPrivateKey = useCryptoStore((state) => state.setPrivateKey);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      username: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const router = useRouter();

  const handleLogin = async (data: LoginFormData) => {
    setIsLoding(true);
    const { username, password } = data;

    try {
      const { data: signInData, error } = await authClient.signIn.email({
        email: `${username}@internal.chat`,
        password,
      });

      if (error) {
        toast.error(error.message);
        setIsLoding(false);
        return;
      }

      const user = signInData?.user as any;

      if (!user || !user.kdfSalt || !user.encryptedPrivateKey) {
        toast.error("Encryption keys not found for this user");
        setIsLoding(false);
        return;
      }

      const masterKey = await deriveMasterKey(password, user.kdfSalt);
      const encryptedData = JSON.parse(user.encryptedPrivateKey);

      const decryptedJWKString = await decryptData(
        base64ToBuffer(encryptedData.ciphertext),
        masterKey,
        new Uint8Array(base64ToBuffer(encryptedData.iv)),
      );
      if (!decryptedJWKString) {
        toast.error("Failed to decrypt private key");
        setIsLoding(false);
        return;
      }

      const privateKey = await window.crypto.subtle.importKey(
        "jwk",
        JSON.parse(decryptedJWKString),
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"],
      );

      setPrivateKey(privateKey);
      toast.success("Login successful!");
      router.push("/chat");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsLoding(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your username and password below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleLogin)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Controller
                  name="username"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="username"
                        type="text"
                        required
                        aria-invalid={fieldState.invalid ? "true" : "false"}
                      />
                      {fieldState.invalid && (
                        <FieldDescription className="text-red-500">
                          {fieldState.error?.message}
                        </FieldDescription>
                      )}
                    </>
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
                    showIcon={false}
                    className="h-8"
                  />
                )}
              />

              <Field>
                <Button type="submit" disabled={isLoding}>
                  {isLoding ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
