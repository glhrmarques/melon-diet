"use client";

import { UserGreeting } from "@/components/UserGreeting";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AddPatient() {
  const usuario = useCurrentUser();

  if (!usuario) return null;

  return (
    <section className="flex flex-col bg-[#ffffff]">
      <UserGreeting nome={usuario.nome} />
    </section>
  );
}
