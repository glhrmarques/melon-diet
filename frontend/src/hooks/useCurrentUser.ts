"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Usuario } from "@/types/usuario";

function isUsuario(value: unknown): value is Usuario {
  if (typeof value !== "object" || value === null) return false;

  const usuario = value as Record<string, unknown>;

  return (
    typeof usuario.id === "number" &&
    typeof usuario.nome === "string" &&
    typeof usuario.email === "string" &&
    typeof usuario.tipo === "string"
  );
}

export function useCurrentUser() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      router.replace("/auth/login");
      return;
    }

    try {
      const usuarioLido: unknown = JSON.parse(usuarioSalvo);

      if (!isUsuario(usuarioLido)) throw new Error("Sessão inválida");

      setUsuario(usuarioLido);
    } catch {
      router.replace("/auth/login");
    }
  }, [router]);

  return usuario;
}
