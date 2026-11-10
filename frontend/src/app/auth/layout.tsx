import type { ReactNode } from "react";

import { UserGreeting } from "@/components/UserGreeting";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <UserGreeting />
      {children}
    </div>
  );
}
