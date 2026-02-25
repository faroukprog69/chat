import Chat from "@/components/chat";
import { getMyConversations } from "@/app/actions/chat";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/signin");
  }

  const conversations = await getMyConversations(session.user.id);
  return (
    <Chat
      conversations={conversations}
      user={{
        id: session.user.id,
        name: session.user.name,
        displayName: session.user.displayName,
      }}
    />
  );
}
