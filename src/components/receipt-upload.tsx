"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReceiptUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const total = files.length;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      setProgress(`${i + 1} / ${total}`);
      const data = new FormData();
      data.set("file", files[i]);
      try {
        const res = await fetch("/api/receipts", { method: "POST", body: data });
        const json = (await res.json()) as { id?: string; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
      } catch {
        failed++;
      }
    }

    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";

    if (failed === 0) {
      toast.success(total === 1 ? "Receipt processed" : `${total} receipts processed`);
    } else {
      toast.error(`${failed} of ${total} failed — check status column`);
    }
    router.refresh();
  }

  const busy = progress !== null;

  return (
    <label
      aria-disabled={busy}
      className={cn(
        buttonVariants(),
        "h-9 cursor-pointer px-4",
        busy && "pointer-events-none opacity-50",
      )}
    >
      {busy ? `Processing ${progress}…` : "Upload receipts"}
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple
        disabled={busy}
        onChange={onPick}
        className="sr-only"
      />
    </label>
  );
}
