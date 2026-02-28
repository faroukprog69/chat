"use client";

import { useState } from "react";
import { useCryptoStore } from "@/store/useCryptoStore";
import { toast } from "sonner";
import { deriveMasterKey } from "@/lib/crypto/deriveKey";
import { decryptData } from "@/lib/crypto/decrypt";
import { base64ToBuffer } from "@/lib/crypto/encoding";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface UnlockPrivateKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UnlockPrivateKeyModal({
  open,
  onOpenChange,
}: UnlockPrivateKeyModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setPrivateKey = useCryptoStore((s) => s.setPrivateKey);
  const setName = useCryptoStore((s) => s.setName);
  const setDisplayName = useCryptoStore((s) => s.setDisplayName);

  async function handleUnlock() {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    try {
      setLoading(true);

      // ✅ فقط عند الضغط على Unlock
      const res = await authClient.getSession();

      if (!res.data?.user) {
        toast.error("Failed to fetch encrypted key");
        return;
      }

      const { encryptedPrivateKey, kdfSalt } = res.data.user;

      // استخرج المفتاح الرئيسي من الباسورد
      const masterKey = await deriveMasterKey(password, kdfSalt);

      const encrypted = JSON.parse(encryptedPrivateKey);

      const decryptedJWKString = await decryptData(
        base64ToBuffer(encrypted.ciphertext),
        masterKey,
        new Uint8Array(base64ToBuffer(encrypted.iv)),
      );

      if (!decryptedJWKString) {
        toast.error("Failed to unlock private key");
        return;
      }

      const privateKey = await window.crypto.subtle.importKey(
        "jwk",
        JSON.parse(decryptedJWKString),
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey", "deriveBits"],
      );

      setPrivateKey(privateKey);
      setName(res.data.user.name);
      setDisplayName(res.data.user.displayName);

      toast.success("Private key unlocked!");
      setPassword("");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to unlock private key");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Unlock Private Key</DialogTitle>
          <DialogDescription>
            Enter your password to decrypt your private key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            />
          </div>

          <Button onClick={handleUnlock} className="w-full" disabled={loading}>
            {loading ? "Unlocking..." : "Unlock"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
