/**
 * Platform Layout - No Blocking
 * Auth is handled by proxy.ts (middleware).
 * Profile checks are handled by individual pages.
 * This layout is sync so loading.tsx shows immediately.
 */
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
