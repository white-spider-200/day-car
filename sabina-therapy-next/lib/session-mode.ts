export type SessionMode = "zoom" | "vr";

const SESSION_MODE_PREFIX = "[SESSION_MODE:";

export function normalizeSessionMode(value?: string | null): SessionMode {
  if (!value) return "zoom";
  return value.toLowerCase() === "vr" ? "vr" : "zoom";
}

export function encodeNotesWithSessionMode(
  notes: string | null | undefined,
  sessionMode: SessionMode
): string | null {
  const clean = (notes ?? "").trim();
  const marker = `${SESSION_MODE_PREFIX}${sessionMode.toUpperCase()}]`;
  return clean ? `${marker}\n${clean}` : marker;
}

export function decodeNotesAndSessionMode(notes: string | null | undefined): {
  sessionMode: SessionMode;
  notes: string | null;
} {
  const raw = (notes ?? "").trim();
  if (!raw) {
    return { sessionMode: "zoom", notes: null };
  }

  if (raw.startsWith(SESSION_MODE_PREFIX)) {
    const closing = raw.indexOf("]");
    if (closing > 0) {
      const markerValue = raw.slice(SESSION_MODE_PREFIX.length, closing).trim().toLowerCase();
      const sessionMode = markerValue === "vr" ? "vr" : "zoom";
      const content = raw.slice(closing + 1).trim();
      return {
        sessionMode,
        notes: content || null
      };
    }
  }

  return {
    sessionMode: "zoom",
    notes: raw
  };
}
