"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReceiptUpload() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (!(data.get("file") as File)?.size) {
      toast.error("Choose a file first");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/receipts", { method: "POST", body: data });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      toast.success("Receipt uploaded and processed");
      form.reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-3">
      <Input
        type="file"
        name="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        disabled={busy}
        className="max-w-xs"
      />
      <Button type="submit" disabled={busy}>
        {busy ? "Processing…" : "Upload receipt"}
      </Button>
    </form>
  );
}
