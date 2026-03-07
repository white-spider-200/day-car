"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { apiFetch } from "@/lib/client-api";

type AccountResponse = {
  user: {
    id: string;
    name: string;
    username: string | null;
    email: string;
    role: "ADMIN" | "DOCTOR" | "USER";
    locale: "en" | "ar";
    createdAt: string;
    updatedAt: string;
  };
};

export function AccountSettingsClient() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const accountQuery = useQuery({
    queryKey: ["account"],
    queryFn: () => apiFetch<AccountResponse>("/api/account")
  });

  useEffect(() => {
    const user = accountQuery.data?.user;
    if (!user) return;

    setName(user.name);
    setUsername(user.username ?? "");
    setLocale(user.locale);
  }, [accountQuery.data?.user]);

  const updateMutation = useMutation({
    mutationFn: () =>
      apiFetch<AccountResponse>("/api/account", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          username,
          locale
        })
      }),
    onSuccess: () => {
      setStatusMessage("Account updated.");
      accountQuery.refetch();
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: true }>("/api/account", {
        method: "DELETE"
      }),
    onSuccess: async () => {
      await signOut({ callbackUrl: "/" });
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    }
  });

  const user = accountQuery.data?.user;

  return (
    <div className="section-shell space-y-5 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user ? (
            <>
              <p className="text-sm text-slate-700">Email: {user.email}</p>
              <p className="text-sm text-slate-700">Role: {user.role}</p>
              <p className="text-sm text-slate-700">Created: {new Date(user.createdAt).toLocaleString()}</p>
              <p className="text-sm text-slate-700">Updated: {new Date(user.updatedAt).toLocaleString()}</p>
            </>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="account-name">Name</Label>
              <Input id="account-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="account-username">Username</Label>
              <Input
                id="account-username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="your_username"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="account-locale">Language</Label>
            <Select id="account-locale" value={locale} onChange={(e) => setLocale(e.target.value as "en" | "ar") }>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </Select>
          </div>

          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-red-700">This will permanently remove your account and related data.</p>
          <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
          <Input id="delete-confirm" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
          <Button
            variant="outline"
            className="text-red-600"
            disabled={deleteConfirm !== "DELETE" || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete My Account"}
          </Button>
        </CardContent>
      </Card>

      {statusMessage ? <p className="text-sm text-slate-600">{statusMessage}</p> : null}
      {accountQuery.error instanceof Error ? <p className="text-sm text-red-600">{accountQuery.error.message}</p> : null}
    </div>
  );
}
