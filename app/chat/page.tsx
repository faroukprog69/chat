import PrivateKeyNeed from "@/components/private_key_need";

export default async function Home() {
  return (
    <PrivateKeyNeed>
      <div className="hidden md:flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          Select a conversation to start chatting
        </p>
      </div>
    </PrivateKeyNeed>
  );
}
