"use client";

import { ChangePasswordForm } from "@/components/settings/change-password";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./profile";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  Notification03Icon,
  ShieldCheck,
  ShieldKeyIcon,
  UserEdit01Icon,
  UserShield01Icon,
} from "@hugeicons/core-free-icons";

export default function SettingsPage({
  name,
  displayName,
}: {
  name: string;
  displayName: string;
}) {
  return (
    <div className=" w-full">
      <div className="max-w-3xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and security preferences.
          </p>
        </div>

        <Separator />

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

          {/* Profile Tab */}
          <TabsContent
            value="profile"
            className="mt-0 focus-visible:outline-none"
          >
            <div className="grid gap-6">
              <div className="bg-card border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                {/* Header Section */}
                <div className="px-6 py-5 border-b bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <HugeiconsIcon icon={UserEdit01Icon} size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight">
                        Public Profile
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage how you appear to others.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <div className="p-6">
                  <ProfileForm user={{ name, displayName }} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab Content */}
          <TabsContent
            value="security"
            className="mt-0 space-y-6 focus-visible:outline-none"
          >
            <div className="grid gap-6">
              {/* Main Card */}
              <div className="bg-card border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                {/* Header Section - Now matches Profile Header exactly */}
                <div className="px-6 py-5 border-b bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <HugeiconsIcon icon={ShieldKeyIcon} size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight">
                        Security Credentials
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your password and encryption keys.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <ChangePasswordForm />
                </div>
              </div>

              {/* Encryption Safety Warning */}
              <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shadow-sm">
                    <HugeiconsIcon icon={UserShield01Icon} size={22} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">
                      End-to-End Encryption Warning
                    </h4>
                    <p className="text-sm text-amber-800/70 dark:text-amber-500/60 leading-relaxed">
                      Your password is the "Master Key" for your encrypted data.
                      Changing it will re-encrypt your identity.
                      <strong> Do not lose this password</strong>; your
                      encrypted chats cannot be recovered without it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-0">
            <div className="p-6 border rounded-xl shadow-sm bg-card">
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                {/* Icon */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <HugeiconsIcon
                      icon={Notification03Icon}
                      className="w-8 h-8 text-primary"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <HugeiconsIcon
                      icon={Clock01Icon}
                      className="w-3 h-3 text-primary"
                    />
                  </div>
                </div>

                {/* Text */}
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

                {/* Badge */}
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
