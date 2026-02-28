"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  AlertCircleIcon,
  LoadingIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function DeleteAccountSection() {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const { error } = await authClient.deleteUser();
      if (error) throw new Error(error.message);

      toast.success("Account deleted successfully");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
            <HugeiconsIcon icon={AlertCircleIcon} size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-destructive">Delete Account</h4>
            <p className="text-sm text-muted-foreground">
              This action is permanent and cannot be undone. All your encrypted
              chats and keys will be permanently removed.
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="destructive" className="mt-4 gap-2" />}
          >
            <HugeiconsIcon icon={Delete02Icon} size={18} />
            Delete My Account
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove all your encrypted data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <HugeiconsIcon
                    icon={LoadingIcon}
                    className="animate-spin"
                    size={18}
                  />
                ) : (
                  "Continue"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
