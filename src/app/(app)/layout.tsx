import { AppShell } from "@/components/layout/app-shell";
import { ThemeSync } from "@/components/layout/theme-sync";
import { getCurrentUser } from "@/lib/auth/session";
import { getThemeForUser } from "@/lib/data/profile";

export default async function AppLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const theme = user ? await getThemeForUser(user.id) : null;

  return (
    <>
      <ThemeSync theme={theme} />
      <AppShell
        user={
          user
            ? { name: user.name, initials: user.initials }
            : null
        }
      >
        {children}
      </AppShell>
      {modal}
    </>
  );
}
