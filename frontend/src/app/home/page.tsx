"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  tipo: string;
};

type Patient = {
  id: number;
  nutricionista_id: number;
  data_nascimento: string;
  nome: string;
  sexo: string;
  altura_cm: number;
  peso_kg: number;
  telefone: string;
};

function calculateAge(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) return "—";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasNotHadBirthdayThisYear =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (hasNotHadBirthdayThisYear) age -= 1;

  return `${age} anos`;
}

export default function Home() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState("");

  useEffect(() => {
    const sessionTimer = window.setTimeout(() => {
      const usuarioSalvo = localStorage.getItem("usuario");

      if (!usuarioSalvo) {
        router.replace("/auth/login");
        return;
      }

      setUsuario(JSON.parse(usuarioSalvo));
    }, 0);

    return () => window.clearTimeout(sessionTimer);
  }, [router]);

  useEffect(() => {
    if (!usuario) return;

    const usuarioID = usuario.id;
    let isCurrent = true;

    async function loadPatients() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/patients?usuario_id=${usuarioID}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Não foi possível carregar os pacientes.");
        }

        if (isCurrent) setPatients(data.pacientes ?? []);
      } catch (error) {
        if (isCurrent) {
          setPatientsError(
            error instanceof Error ? error.message : "Não foi possível carregar os pacientes.",
          );
        }
      } finally {
        if (isCurrent) setLoadingPatients(false);
      }
    }

    loadPatients();

    return () => {
      isCurrent = false;
    };
  }, [usuario]);

  if (!usuario) return null;

  return (
    <section className="flex flex-col bg-[#ffffff]">
        <div className="
        flex justify-between p-6
        bg-[#ffffff] border-b border-black/20">
            <p className="text-[16px] font-[700]">NUTRI</p>
            <p className="font-[400] leading-none">Olá, {usuario.nome}</p>
        </div>
        <div className="p-6">
            <p className="text-[16px] text-[32px] font-[600]">Meus pacientes</p>
        </div>

        {loadingPatients && <p className="px-6 text-[14px]">Carregando pacientes...</p>}
        {patientsError && <p className="px-6 text-[14px] text-red-600">{patientsError}</p>}
        {!loadingPatients && !patientsError && patients.length === 0 && (
          <p className="px-6 text-[14px]">Nenhum paciente cadastrado.</p>
        )}
        
        <div className="grid grid-cols-6 px-10 mb-3">
          <p className="text-[12px] font-[600] text-gray-500">Paciente</p>
          <p className="text-[12px] font-[600] text-gray-500">Celular</p>
          <p className="text-[12px] font-[600] text-gray-500">Idade</p>
          <p className="text-[12px] font-[600] text-gray-500">Altura</p>
          <p className="text-[12px] font-[600] text-gray-500">Peso</p>
          <p className="text-[12px] font-[600] text-gray-500">Sexo</p>
        </div>
        {patients.map((patient) => (
          <div key={patient.id} className="px-6">
            <div className="grid grid-cols-6 items-center border border-gray-300 p-3 mb-2 rounded-[16px]">
              <div className="flex gap-2 items-center">
                <div className="grid place-items-center w-[32px] h-[32px] bg-gray-200 rounded-full">
                  <p className="text-[14px] font-[700] leading-none text-center">{patient.nome.charAt(0)}</p>
                </div>
                <p className="text-[14px] font-[600] leading-none">{patient.nome}</p>
              </div>
              <p className="text-[14px] font-[400] leading-none">{patient.telefone}</p>
              <p className="text-[14px] font-[400] leading-none">{calculateAge(patient.data_nascimento)}</p>
              <p className="text-[14px] font-[400] leading-none">{patient.altura_cm} cm</p>
              <p className="text-[14px] font-[400] leading-none">{patient.peso_kg} kg</p>
              <p className="text-[14px] font-[400] leading-none">{patient.sexo}</p>
            </div>
          </div>
        ))}

        {/* TABLE */}

    </section>
  );
}
