"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createChatAction } from "@/app/actions/chat";

type CreateChatFormData = {
  type: "direct" | "group";
  username?: string;
  title?: string;
};

export function CreateChatForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, watch } = useForm<CreateChatFormData>({
    defaultValues: {
      type: "direct",
      username: "",
      title: "",
    },
  });

  const chatType = watch("type");

  const handleCreate = async (data: CreateChatFormData) => {
    // ✅ تحقق بسيط يدوي
    if (data.type === "direct" && !data.username?.trim()) {
      toast.error("Username is required");
      return;
    }

    if (data.type === "group" && !data.title?.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createChatAction(data);

      if (!result?.success) {
        toast.error(result?.error || "Failed to create chat");
        return;
      }

      toast.success("Chat created successfully!");
      router.push(`/chat/${result.conversationId}`);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleCreate)}>
      <FieldGroup className="space-y-6">
        <Field>
          <FieldLabel>Chat Type</FieldLabel>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  type="button"
                  variant={field.value === "direct" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => field.onChange("direct")}
                >
                  Direct
                </Button>

                <Button
                  type="button"
                  variant={field.value === "group" ? "default" : "ghost"}
                  className="flex-1"
                  disabled
                  onClick={() => field.onChange("group")}
                >
                  Group
                </Button>
              </div>
            )}
          />
        </Field>

        {chatType === "direct" && (
          <Field>
            <FieldLabel>Recipient Username</FieldLabel>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="e.g. ahmad_123"
                  autoComplete="off"
                />
              )}
            />
          </Field>
        )}

        <Button type="submit" disabled={isLoading} className="w-full h-11">
          {isLoading ? "Creating..." : "Start Chat"}
        </Button>
      </FieldGroup>
    </form>
  );
}
