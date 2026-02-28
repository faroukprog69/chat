import { LoginForm } from "@/components/forms/login-form";
import { getCurrentUser, requireUser } from "@/app/data/user/require-user";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/chat");
  }
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
