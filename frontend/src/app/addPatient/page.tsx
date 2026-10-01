"use client";

import { UserGreeting } from "@/components/UserGreeting";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

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
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [email, setEmail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!usuario || submitting.current) return;

    setSubmitError("");
    const heightMeters = Number(height);
    const weightKg = Number(weight);
    const heightCm = Math.round(heightMeters * 100);

    if (
      !name.trim() || !height.trim() || !weight.trim() ||
      !Number.isFinite(heightCm) || !Number.isFinite(weightKg) ||
      heightCm <= 0 || weightKg <= 0
    ) {
      setSubmitError("Confira o nome, a altura e o peso.");
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);
    const failureMessage = "Não foi possível cadastrar o paciente. Tente novamente.";

    try {
      const apiURL = process.env.NEXT_PUBLIC_API_URL;
      if (!apiURL) throw new Error(failureMessage);

      const response = await fetch(`${apiURL}/patients?usuario_id=${usuario.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: name.trim(),
          data_nascimento: birthDate,
          sexo: sex,
          altura_cm: heightCm,
          peso_kg: weightKg,
          email: email.trim(),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : failureMessage);
      }
      router.push("/home");
    } catch (error) {
      setSubmitError(error instanceof Error && error.message !== "Failed to fetch"
        ? error.message : failureMessage);
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

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

          <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="grid grid-cols-3 gap-x-3 gap-y-4">
            <div className="col-span-3 grid grid-cols-2 gap-3">
              <label htmlFor="patient-name" className="sr-only">Nome</label>
              <input
                id="patient-name"
                disabled={isSubmitting}
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
              <label htmlFor="patient-birth-date" className="sr-only">Data de nascimento</label>
              <input
                id="patient-birth-date"
                disabled={isSubmitting}
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
              <label htmlFor="patient-sex" className="sr-only">Sexo</label>
              <select
                id="patient-sex"
                disabled={isSubmitting}
                required
                value={sex}
                onChange={(event) => setSex(event.target.value)}
                className="
                w-full border border-[#939393] rounded-[16px] p-3 text-[16px]
                hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
                focus:outline-[#000000]
                "
              >
                <option value="" disabled>Sexo</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
                <option value="Não informado">Não informado</option>
              </select>
              <label htmlFor="patient-height" className="sr-only">Altura (m)</label>
              <input
                id="patient-height"
                min="0.01"
                step="0.01"
                disabled={isSubmitting}
                type="number"
                placeholder="Altura (m)"
                required
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                className="
                w-full border border-[#939393] rounded-[16px] p-3 text-[16px]
                hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
                focus:outline-[#000000]
                "
              />
              <label htmlFor="patient-weight" className="sr-only">Peso (kg)</label>
              <input
                id="patient-weight"
                min="0.1"
                step="0.1"
                disabled={isSubmitting}
                type="number"
                placeholder="Peso (kg)"
                required
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                className="
                w-full border border-[#939393] rounded-[16px] p-3 text-[16px]
                hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
                focus:outline-[#000000]
                "
              />
              <label htmlFor="patient-email" className="sr-only">E-mail</label>
              <input
                id="patient-email"
                disabled={isSubmitting}
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
              type="submit"
              disabled={isSubmitting}
              className="col-span-3 justify-self-end px-12 py-3 bg-[#000000] rounded-[16px] text-[#ffffff] font-[500] mt-[16px]
              hover:bg-[#3d3d3d] cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? "Cadastrando..." : "Confirmar cadastro"}
              </button>
            {submitError && <p role="alert" className="col-span-3 text-red-600">{submitError}</p>}
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
