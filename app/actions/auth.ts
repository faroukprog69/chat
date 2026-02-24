"use server";
import { db } from "@/db";
import { inviteCodes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function validateInviteCode(code: string) {
  const record = await db.query.inviteCodes.findFirst({
    where: eq(inviteCodes.code, code),
  });

  if (!record || record.isUsed) {
    return { success: false, error: "Invalid or used invite code." };
  }

  return { success: true };
}

export async function useInviteCode(code: string) {
  await db
    .update(inviteCodes)
    .set({ isUsed: true })
    .where(eq(inviteCodes.code, code));
}
