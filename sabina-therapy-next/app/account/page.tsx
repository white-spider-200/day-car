import { redirect } from "next/navigation";
import { AccountSettingsClient } from "@/components/account/account-settings-client";
import { getAuthSession } from "@/lib/auth";

export default async function AccountPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <AccountSettingsClient />;
}
