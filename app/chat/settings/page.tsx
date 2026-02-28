import SettingsPage from "@/components/settings";
import PrivateKeyNeed from "@/components/private_key_need";

export default async function Settings() {
  return (
    <PrivateKeyNeed>
      <SettingsPage />
    </PrivateKeyNeed>
  );
}
