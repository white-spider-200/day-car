const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

export function isValidYoutubeId(value: string): boolean {
  return YOUTUBE_ID_REGEX.test(value);
}

export function extractYoutubeId(input: string): string | null {
  const raw = input.trim();

  if (!raw) {
    return null;
  }

  if (isValidYoutubeId(raw)) {
    return raw;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

  if (hostname === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return isValidYoutubeId(id) ? id : null;
  }

  if (hostname !== "youtube.com" && hostname !== "m.youtube.com") {
    return null;
  }

  if (url.pathname === "/watch") {
    const id = url.searchParams.get("v") ?? "";
    return isValidYoutubeId(id) ? id : null;
  }

  const pathParts = url.pathname.split("/").filter(Boolean);
  if (pathParts[0] === "shorts" && pathParts[1]) {
    return isValidYoutubeId(pathParts[1]) ? pathParts[1] : null;
  }

  return null;
}
