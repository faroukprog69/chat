import { ChatMain } from "@/components/chat/main";
import { ChatDal } from "@/app/data/chat/chat-dal";
import PrivateKeyNeed from "@/components/private_key_need";
import { RealtimeProvider } from "@/components/providers/ably-provider";
import { RealtimeChannel } from "@/components/providers/channel-provider";
import { CHANNELS } from "@/realtime/channels";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const conversationDal = await ChatDal.create();
  const conversationById = await conversationDal.getConversationById(id);
  const rawMessages = await conversationDal.getMessages(id, 20); // load initial 20 messages
  let user = conversationDal.getCurrentUser();
  return (
    <PrivateKeyNeed>
      <RealtimeProvider>
        <RealtimeChannel
          channelName={CHANNELS.CHAT(conversationById!.conversation.id)}
        >
          <ChatMain
            currentUserId={user.id}
            conversation={conversationById!}
            initialRawMessages={rawMessages}
          />
        </RealtimeChannel>
      </RealtimeProvider>
    </PrivateKeyNeed>
  );
}
