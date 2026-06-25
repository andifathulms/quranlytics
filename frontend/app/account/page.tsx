"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AccountPage() {
  const { user, ready, login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in → go to dashboard.
  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(username, password);
      else await register(username, email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <div className="mb-4 flex gap-2 text-sm">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`rounded-full px-3 py-1 ${
                mode === m
                  ? "bg-khatulistiwa text-parchment"
                  : "border border-sand text-lapis/70"
              }`}
            >
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            required
            className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-lapis focus:border-khatulistiwa focus:outline-none"
          />
          {mode === "register" && (
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-lapis focus:border-khatulistiwa focus:outline-none"
            />
          )}
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-lapis focus:border-khatulistiwa focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-khatulistiwa px-4 py-2 text-parchment hover:bg-lapis disabled:opacity-50"
          >
            {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </Card>
    </div>
  );
}
