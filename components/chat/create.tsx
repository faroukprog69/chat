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
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createChatAction } from "@/app/actions/chat";

const createChatSchema = z.object({
  type: z.enum(["direct", "group"]),
  title: z.string().optional(),
  username: z.string().optional(),
});

type CreateChatFormData = z.infer<typeof createChatSchema>;

export function CreateChatForm({
  className,
  onSuccess,
  userId,
  ...props
}: React.ComponentProps<"div"> & {
  onSuccess?: (conversationId: string) => void;
  userId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateChatFormData>({
    defaultValues: {
      type: "direct",
      title: "",
      username: "",
    },
    resolver: zodResolver(createChatSchema),
  });

  const type = watch("type");

  const handleCreate = async (data: CreateChatFormData) => {
    setIsLoading(true);

    try {
      const result = await createChatAction({
        ...data,
        userId,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Chat ready!");
      onSuccess?.(result.conversationId);
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn("flex flex-1 items-center justify-center", className)}
      {...props}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create new chat</CardTitle>
          <CardDescription>
            Start a new conversation or create a group chat
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(handleCreate)}>
            <FieldGroup>
              {/* Chat Type */}
              <Field>
                <FieldLabel>Chat Type</FieldLabel>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={
                          field.value === "direct" ? "default" : "outline"
                        }
                        onClick={() => field.onChange("direct")}
                      >
                        Direct
                      </Button>

                      <Button
                        type="button"
                        variant={
                          field.value === "group" ? "default" : "outline"
                        }
                        onClick={() => field.onChange("group")}
                      >
                        Group
                      </Button>
                    </div>
                  )}
                />
              </Field>

              {/* Username (Direct) */}
              {type === "direct" && (
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
                          placeholder="Enter username"
                          aria-invalid={fieldState.invalid}
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
              )}

              {/* Title (Group) */}
              {type === "group" && (
                <Field>
                  <FieldLabel htmlFor="title">Group Title</FieldLabel>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          id="title"
                          placeholder="Enter group name"
                          aria-invalid={fieldState.invalid}
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
              )}

              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Creating..." : "Create Chat"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
