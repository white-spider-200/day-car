import { describe, expect, it } from "vitest";
import { extractYoutubeId, isValidYoutubeId } from "@/lib/youtube";

describe("YouTube parser", () => {
  it("extracts ID from watch URL", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from youtu.be share URL", () => {
    expect(extractYoutubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from shorts URL", () => {
    expect(extractYoutubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("accepts raw ID", () => {
    expect(extractYoutubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(isValidYoutubeId("dQw4w9WgXcQ")).toBe(true);
  });

  it("rejects invalid IDs and hosts", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=bad")).toBeNull();
    expect(extractYoutubeId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(isValidYoutubeId("bad")).toBe(false);
  });
});
