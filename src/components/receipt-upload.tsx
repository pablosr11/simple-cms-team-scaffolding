"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReceiptUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    const data = new FormData();
    data.set("file", file);
    try {
      const res = await fetch("/api/receipts", { method: "POST", body: data });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      toast.success("Receipt uploaded and processed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <label
      aria-disabled={busy}
      className={cn(
        buttonVariants(),
        "h-9 cursor-pointer px-4",
        busy && "pointer-events-none opacity-50",
      )}
    >
      {busy ? "Processing…" : "Upload receipt"}
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        disabled={busy}
        onChange={onPick}
        className="sr-only"
      />
    </label>
  );
}
