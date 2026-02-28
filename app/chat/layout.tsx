import { ChatSidebar } from "@/components/chat/sidebar";
import { ChatDal } from "@/app/data/chat/chat-dal";
import { cn } from "@/lib/utils";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const chatDal = await ChatDal.create();
  const conversations = await chatDal.getMyConversations();
  const user = chatDal.getCurrentUser();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ===== SIDEBAR ===== */}
      <ChatSidebar currentUserId={user.id} conversations={conversations} />

      {/* ===== MAIN AREA ===== */}
      <div
        className={cn(
          "flex flex-col overflow-hidden transition-all duration-0",
          "flex-1",
        )}
      >
        {children}
      </div>
    </div>
  );
}
