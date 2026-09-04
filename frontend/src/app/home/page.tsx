"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  tipo: string;
};

export default function home() {

    const router = useRouter();
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      router.replace("/auth/login");
      return;
    }

    setUsuario(JSON.parse(usuarioSalvo));
  }, [router]);

  if (!usuario) return null;

  return (
    <section className="flex flex-col gap-10">
        <div className="
        flex justify-between p-6
        border-b border-black/20">
            <p className="text-[16px] font-[700]">NUTRI</p>
            <p className="font-[400] leading-none">Olá, {usuario.nome}</p>
        </div>
        <div className="p-6">
            <p className="text-[16px] text-[32px] font-[600]">Meus pacientes</p>
        </div>
    </section>
  );
}
