"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyScenarioTitle } from "@/lib/vr";

type ScenarioCreateFormProps = {
  onSubmit: (payload: {
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    youtubeUrl: string;
  }) => Promise<void>;
  submitting: boolean;
};

export function ScenarioCreateForm({ onSubmit, submitting }: ScenarioCreateFormProps) {
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const generatedSlug = useMemo(() => slugifyScenarioTitle(titleEn), [titleEn]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit({
        titleEn,
        titleAr,
        descriptionEn,
        descriptionAr,
        youtubeUrl
      });
      setTitleEn("");
      setTitleAr("");
      setDescriptionEn("");
      setDescriptionAr("");
      setYoutubeUrl("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create scenario");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vr-title-en">Title (EN)</Label>
          <Input
            id="vr-title-en"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Fear of Heights Exposure"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vr-title-ar">Title (AR)</Label>
          <Input
            id="vr-title-ar"
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            placeholder="التعرض للخوف من المرتفعات"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Slug (Auto)</Label>
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{generatedSlug}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vr-description-en">Description (EN)</Label>
          <textarea
            id="vr-description-en"
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            required
            className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vr-description-ar">Description (AR)</Label>
          <textarea
            id="vr-description-ar"
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            required
            className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vr-youtube-url">YouTube URL</Label>
        <Input
          id="vr-youtube-url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
          required
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Create Scenario"}
      </Button>
    </form>
  );
}
