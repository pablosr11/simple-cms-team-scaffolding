"use client";

import { useRef } from "react";
import { deleteReceipt } from "@/app/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeleteReceiptButton({
  id,
  variant = "list",
}: {
  id: string;
  variant?: "list" | "detail";
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleClick() {
    if (!window.confirm("Delete this receipt? This cannot be undone.")) return;
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={deleteReceipt}>
      <input type="hidden" name="id" value={id} />
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          variant === "detail"
            ? buttonVariants({ variant: "destructive" })
            : "text-muted-foreground hover:text-destructive",
        )}
      >
        {variant === "detail" ? "Delete receipt" : "✕"}
      </button>
    </form>
  );
}
