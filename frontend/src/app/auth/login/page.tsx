"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
	const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        },
      );

      const data = await response.json();

      type Usuario = {
        id: number;
        nome: string;
        email: string;
        tipo: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }


      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      router.replace("/home");
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
	}

  return (
        <section className="h-screen grid grid-cols-[40%_60%]">
          <div className="bg-[#ffffff] flex flex-col justify-center items-center gap-2 px-30">
            <div className="w-4 h-4 bg-[#000000]"></div>
            <h1 className="text-[32px] font-[700]">Acesso nutricionista</h1>
            <p className="text-[18px] font-[400] text-content-secondary">Dieta fácil de seguir e seja o orgulho do nutri.</p>
			<form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 w-full mt-10">
			  <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="E-mail"
              required
              className="
              border border-[#939393] rounded-[16px] p-3 text-[16px]
              hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
              focus:outline-[#000000]
              "
              />
              <input
              type="password"
              value={senha}
              onChange={(event) =>setSenha(event.target.value)}
              placeholder="Senha de acesso"
              required
              className="border border-[#939393] rounded-[16px] p-3 text-[16px]
              hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
              focus:outline-[#000000]"
              />
              {error && <p role="alert">{error}</p>}
			  <button
			  type="submit"
              className="w-full px-12 py-3 bg-[#000000] rounded-[16px] text-white
              hover:bg-[#3d3d3d] cursor-pointer transition-colors">
                {loading ? "Entrando..." : "Acessar conta"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => router.push('/auth/signup')}
              className="mt-16 w-full px-12 py-3 bg-[#F6F2EF] rounded-[16px] text-black
              hover:bg-[#e3dcd6] cursor-pointer transition-colors">
                Criar conta
              </button>
          </div>
          <div className="bg-[#C8FFEC]"></div>
        </section>
  );
}
