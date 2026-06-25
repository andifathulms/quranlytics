// Authenticated API calls (client-side only). JWT is passed per-request; these
// never cache. The token endpoint returns raw {access, refresh}; everything
// else uses the standard {data, meta, errors} envelope.
import { ApiError } from "./client";
import type {
  Bookmark,
  Discovery,
  Envelope,
  Note,
  Profile,
  User,
} from "./types";

export interface DiscoveryInput {
  title: string;
  body: string;
  category: string;
  payload?: Record<string, unknown>;
  is_public?: boolean;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8010/api/v1";

async function authRequest<T>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  // 204/empty bodies (rare) — treat as success with no data.
  const text = await res.text();
  const body = text ? (JSON.parse(text) as Envelope<T>) : ({ data: null } as Envelope<T>);
  if (!res.ok) {
    throw new ApiError(body?.errors?.[0]?.message || `Request failed (${res.status})`, res.status);
  }
  return body.data;
}

export const auth = {
  async login(username: string, password: string): Promise<{ access: string; refresh: string }> {
    const res = await fetch(`${API_BASE}/auth/token/`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.detail || "Invalid username or password", res.status);
    }
    return data;
  },

  register: (username: string, email: string, password: string) =>
    authRequest<User>("/auth/register/", null, {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  me: (token: string) => authRequest<User>("/auth/me/", token),

  // Bookmarks
  listBookmarks: (token: string) => authRequest<Bookmark[]>("/bookmarks/", token),
  createBookmark: (token: string, verse: number) =>
    authRequest<Bookmark>("/bookmarks/", token, {
      method: "POST",
      body: JSON.stringify({ verse }),
    }),
  deleteBookmark: (token: string, id: number) =>
    authRequest<unknown>(`/bookmarks/${id}/`, token, { method: "DELETE" }),

  // Notes
  listNotes: (token: string) => authRequest<Note[]>("/notes/", token),
  createNote: (token: string, verse: number, body: string) =>
    authRequest<Note>("/notes/", token, {
      method: "POST",
      body: JSON.stringify({ verse, body }),
    }),
  updateNote: (token: string, id: number, body: string) =>
    authRequest<Note>(`/notes/${id}/`, token, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    }),
  deleteNote: (token: string, id: number) =>
    authRequest<unknown>(`/notes/${id}/`, token, { method: "DELETE" }),

  // ── Discoveries (token may be null for public reads) ──
  listDiscoveries: (
    token: string | null,
    opts: { sort?: "top" | "recent"; category?: string } = {},
  ) => {
    const qs = new URLSearchParams();
    if (opts.sort) qs.set("sort", opts.sort);
    if (opts.category) qs.set("category", opts.category);
    return authRequest<Discovery[]>(`/discoveries/?${qs.toString()}`, token);
  },
  getDiscovery: (token: string | null, id: number) =>
    authRequest<Discovery>(`/discoveries/${id}/`, token),
  myDiscoveries: (token: string) =>
    authRequest<Discovery[]>(`/discoveries/mine/`, token),
  createDiscovery: (token: string, data: DiscoveryInput) =>
    authRequest<Discovery>(`/discoveries/`, token, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteDiscovery: (token: string, id: number) =>
    authRequest<unknown>(`/discoveries/${id}/`, token, { method: "DELETE" }),
  voteDiscovery: (token: string, id: number, value: -1 | 0 | 1) =>
    authRequest<{ id: number; vote_score: number; my_vote: number }>(
      `/discoveries/${id}/vote/`,
      token,
      { method: "POST", body: JSON.stringify({ value }) },
    ),
  profile: (token: string | null, username: string) =>
    authRequest<Profile>(`/profiles/${username}/`, token),
};
