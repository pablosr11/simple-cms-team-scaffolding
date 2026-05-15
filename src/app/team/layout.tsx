import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <div className="mx-auto w-full max-w-4xl flex-1 p-6">{children}</div>
    </div>
  );
}
