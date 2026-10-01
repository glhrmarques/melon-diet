"use client";

import { UserGreeting } from "@/components/UserGreeting";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState } from "react";

function formatCardName(name: string) {
  const nameParts = name.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length < 2) return nameParts[0] ?? "";

  return `${nameParts[0]} ${nameParts.at(-1)?.charAt(0).toUpperCase()}.`;
}

function calculateAge(birthDate: string) {
  if (!birthDate) return "";

  const today = new Date();
  const [year, month, day] = birthDate.split("-").map(Number);
  let age = today.getFullYear() - year;

  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age -= 1;
  }

  return age >= 0 ? `${age} ${age === 1 ? "Ano" : "Anos"}` : "";
}

export default function AddPatient() {
  const usuario = useCurrentUser();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [email, setEmail] = useState("");

  if (!usuario) return null;

  return (
    <section className="flex flex-col bg-[#ffffff] h-screen">
      <UserGreeting nome={usuario.nome} />
      <div className="flex flex-row justify-center gap-6 h-[100%]">
        <div className="w-[60%] p-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8">
            <path strokeLinejoin="round" strokeLinecap="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
          </svg>


          <p className="text-[32px] font-[500]">Adicionar paciente</p>
          <p className="text-[18px] font-[400] pb-10 text-[#000000]/50">Informe os dados do paciente.</p>

          <form className="grid grid-cols-3 gap-x-3 gap-y-4">
            <div className="col-span-3 grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nome"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="
                w-full border border-[#939393] rounded-[16px] p-3 text-[16px]
                hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
                focus:outline-[#000000]
                "
              />
              <input
                type="date"
                placeholder="Data de nascimento"
                required
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className="
                w-full border border-[#939393] rounded-[16px] p-3 text-[16px]
                hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
                focus:outline-[#000000]
                "
              />
            </div>
              <input
                type="text"
                placeholder="Sexo"
                required
                value={sex}
                onChange={(event) => setSex(event.target.value)}
                className="
                w-full border border-[#939393] rounded-[16px] p-3 text-[16px]
                hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
                focus:outline-[#000000]
                "
              />
              <input
                type="number"
                placeholder="Altura"
                required
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                className="
                w-full border border-[#939393] rounded-[16px] p-3 text-[16px]
                hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
                focus:outline-[#000000]
                "
              />
              <input
                type="number"
                placeholder="Peso"
                required
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                className="
                w-full border border-[#939393] rounded-[16px] p-3 text-[16px]
                hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
                focus:outline-[#000000]
                "
              />
              <input
                type="email"
                placeholder="E-mail"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="
                col-span-3 w-full border border-[#939393] rounded-[16px] p-3 text-[16px]
                hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
                focus:outline-[#000000]
                "
              />
              <button
              type="button"
              className="col-span-3 justify-self-end px-12 py-3 bg-[#000000] rounded-[16px] text-[#ffffff] font-[500 mt-[16px]
              hover:bg-[#3d3d3d] cursor-pointer transition-colors">
                Confirmar cadastro
              </button>
          </form>

        </div>
        <div className="w-[40%] p-12 flex justify-center items-center border-l border-black/20">
          <div className="flex flex-col justify-between w-[332px] h-[332px] bg-[#E8E8E8] rounded-[16px] p-6">
            <div className="w-[80px] h-[80px] bg-[#F3F5F9] flex items-center justify-center rounded-full p-6">
              <p className="text-[40px] font-[700]">{name.trim().charAt(0).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-[32px] font-[600] mb-2 min-h-12">{formatCardName(name)}</p>
              <div className="text-[16px] flex flex-row justify-between">
                <p>{calculateAge(birthDate)}</p>
                <p>{sex}</p>
                <p>{height ? `${height}m` : ""}</p>
                <p>{weight ? `${weight}kg` : ""}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
