import { CreateChatForm } from "@/components/chat/create";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft } from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import PrivateKeyNeed from "@/components/private_key_need";

export default async function CreateChat() {
  return (
    <PrivateKeyNeed>
      <div className={cn("flex flex-1 flex-col items-center p-4 md:p-8")}>
        {/* Back Button - Mobile Only */}
        <div className="self-start mb-4 md:hidden">
          <Button variant="ghost" size="icon">
            <Link href="/chat">
              <HugeiconsIcon icon={ArrowLeft} className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center w-full">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Start Conversation</CardTitle>
              <CardDescription>
                Search for a user by username to start a private chat.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <CreateChatForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </PrivateKeyNeed>
  );
}

export const dynamic = "force-dynamic";
