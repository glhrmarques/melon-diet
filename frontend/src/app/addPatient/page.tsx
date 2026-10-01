"use client";

import { UserGreeting } from "@/components/UserGreeting";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AddPatient() {
  const usuario = useCurrentUser();

  if (!usuario) return null;

  return (
    <section className="flex flex-col bg-[#ffffff] h-screen">
      <UserGreeting nome={usuario.nome} />
      <div className="flex flex-row justify-center gap-6 h-[100%]">
        <div className="w-[60%] p-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-8">
            <path strokeLinecap="round" stroke-linejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
          </svg>


          <p className="text-[32px] font-[500]">Adicionar paciente</p>
          <p className="text-[18px] font-[400] pb-10 text-[#000000]/50">Informe os dados do paciente.</p>

          <form className="grid grid-cols-3 gap-x-3 gap-y-4">
            <div className="col-span-3 grid grid-cols-2 gap-3">
              <input
                type="name"
                placeholder="Nome"
                required
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
              <p className="text-[40px] font-[700]">G</p>
            </div>
            <div>
              <p className="text-[32px] font-[600] mb-2">Guilherme M.</p>
              <div className="text-[16px] flex flex-row justify-between">
                <p>Masculino</p>
                <p>23 Anos</p>
                <p>1.70m</p>
                <p>90kg</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
