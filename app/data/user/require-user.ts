import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }
  return session.user;
});

export const requireUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin");
  }
  return user;
});
