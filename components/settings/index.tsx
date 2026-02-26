"use client";

import { ChangePasswordForm } from "@/components/settings/change-password";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./profile";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft,
  Clock01Icon,
  Notification03Icon,
  ShieldKeyIcon,
  UserEdit01Icon,
  UserShield01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "../ui/button";

export default function SettingsPage({
  name,
  displayName,
  onBack,
}: {
  name: string;
  displayName: string;
  onBack: () => void;
}) {
  return (
    <div className="w-full p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* ===== HEADER ===== */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0 md:hidden"
          >
            <HugeiconsIcon icon={ArrowLeft} className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage your account settings and security preferences.
            </p>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <Tabs defaultValue="profile" className="space-y-6">
          {/* Tabs Navigation */}
          <TabsList className="w-full justify-start bg-muted/40 p-1 rounded-lg h-[36px]!">
            <TabsTrigger
              value="profile"
              className="px-4 py-2 rounded-md transition-all 
              data-[state=active]:bg-background 
              data-[state=active]:shadow-sm"
            >
              Profile
            </TabsTrigger>

            <TabsTrigger
              value="security"
              className="px-4 py-2 rounded-md transition-all 
              data-[state=active]:bg-background 
              data-[state=active]:shadow-sm"
            >
              Security
            </TabsTrigger>

            <TabsTrigger
              value="notifications"
              className="px-4 py-2 rounded-md transition-all 
              data-[state=active]:bg-background 
              data-[state=active]:shadow-sm"
            >
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* ===== PROFILE TAB ===== */}
          <TabsContent
            value="profile"
            className="mt-0 focus-visible:outline-none"
          >
            <div className="bg-card border rounded-2xl shadow-sm">
              <div className="px-6 py-5 border-b bg-muted/20 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <HugeiconsIcon icon={UserEdit01Icon} size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Public Profile</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage how you appear to others.
                  </p>
                </div>
              </div>
              <div className="p-6">
                <ProfileForm user={{ name, displayName }} />
              </div>
            </div>
          </TabsContent>

          {/* ===== SECURITY TAB ===== */}
          <TabsContent
            value="security"
            className="mt-0 space-y-4 focus-visible:outline-none"
          >
            {/* Password Card */}
            <div className="bg-card border rounded-2xl shadow-sm">
              <div className="px-6 py-5 border-b bg-muted/20 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <HugeiconsIcon icon={ShieldKeyIcon} size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Security Credentials</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your password and encryption keys.
                  </p>
                </div>
              </div>
              <div className="p-6">
                <ChangePasswordForm />
              </div>
            </div>

            {/* Warning — مرة وحدة بس */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <HugeiconsIcon icon={UserShield01Icon} size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    End-to-End Encryption Warning
                  </h4>
                  <p className="text-sm text-amber-700/70 dark:text-amber-500/70 leading-relaxed">
                    Your password is the "Master Key" for your encrypted data.
                    Changing it will re-encrypt your identity.{" "}
                    <strong>Do not lose this password</strong> — your encrypted
                    chats cannot be recovered without it.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ===== NOTIFICATIONS TAB ===== */}
          <TabsContent value="notifications" className="mt-0">
            <div className="border rounded-2xl shadow-sm bg-card">
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <HugeiconsIcon
                      icon={Notification03Icon}
                      className="w-8 h-8 text-primary"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background border flex items-center justify-center">
                    <HugeiconsIcon
                      icon={Clock01Icon}
                      className="w-3 h-3 text-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-lg font-semibold">
                    Notifications Coming Soon
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We're building a powerful notification system. You'll be
                    able to control email alerts, push notifications, and sound
                    preferences.
                  </p>
                </div>

                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  In Development
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
