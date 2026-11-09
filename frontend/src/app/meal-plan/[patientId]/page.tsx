"use client";

import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { BackButton } from "@/components/BackButton";
import { UserGreeting } from "@/components/UserGreeting";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const periods = {
  cafe_da_manha: "Café da manhã",
  almoco: "Almoço",
  lanche_tarde: "Café da Tarde",
  jantar: "Janta",
};

const measures = ["g", "unidade", "fatia", "colher", "xícara"];
const fieldStyle = "w-full rounded-2xl border border-[#ddd] bg-white text-sm cursor-pointer transition-colors hover:outline-[1.5] hover:outline-black";
const field = fieldStyle + " h-12 min-w-0 px-3";
const selectField = field + " appearance-none bg-[url('/meal-plan/8c821.svg')] bg-[right_12px_center] bg-no-repeat pr-8";
const mealTimes = Array.from({ length: 47 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, "0");
  return hour + (index % 2 === 0 ? ":00" : ":30");
});
const divider = "my-10 w-full border-t border-black/20";

type Food = { id: number; nome: string };
type DraftFood = {
  draftId: number;
  taco_id: number;
  nome: string;
  medida: string;
  quantidade: string;
};
type SavedFood = Omit<DraftFood, "draftId" | "quantidade"> & {
  quantidade: number;
  peso_gramas: number | null;
};
type Meal = {
  id: number;
  horario: string;
  periodo: keyof typeof periods;
  observacao: string;
  alimentos: SavedFood[];
};

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Não foi possível concluir a operação.");
  return data;
}

function Icon({ file, size }: { file: string; size: number }) {
  return <Image src={`/meal-plan/${file}`} width={size} height={size} alt="" unoptimized />;
}

function FoodSummary({ foods }: { foods: SavedFood[] }) {
  return (
    <ul>
      {foods.map((food, index) => (
        <li key={index} className="border-b border-black/20 py-4 text-sm">
          <span className="font-medium">{food.nome}</span>{" "}
          {food.quantidade} {food.medida}
        </li>
      ))}
    </ul>
  );
}

function MealEditor({ base, userId, planId, onSaved, onBack }: {
  base: string;
  userId: number;
  planId: string | null;
  onSaved: (id: number) => void;
  onBack: () => void;
}) {
  const [period, setPeriod] = useState("");
  const [time, setTime] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [foods, setFoods] = useState<DraftFood[]>([]);
  const nextFoodId = useRef(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const requestId = useRef<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { alimentos } = await api<{ alimentos: Food[] }>(
          `/alimentos?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          setResults(alimentos);
          setSearchMessage(alimentos.length ? "" : "Nenhum alimento encontrado.");
        }
      } catch {
        if (!controller.signal.aborted) setSearchMessage("Não foi possível pesquisar alimentos.");
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function changeQuery(value: string) {
    setQuery(value);
    setResults([]);
    setSearchMessage("");
  }

  function updateFood(index: number, changes: Partial<DraftFood>) {
    setFoods(foods.map((food, i) => i === index ? { ...food, ...changes } : food));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !foods.length) return;
    setSaving(true);
    setError("");
    requestId.current ??= crypto.randomUUID();
    try {
      const { dieta_id } = await api<{ dieta_id: number }>(`${base}/plan-meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: userId,
          dieta_id: Number(planId),
          pedido_id: requestId.current,
          periodo: period,
          horario: time,
          observacao: notes,
          alimentos: foods.map((food) => ({
            taco_id: food.taco_id,
            medida: food.medida,
            quantidade: Number(food.quantidade),
          })),
        }),
      });
      onSaved(dieta_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a refeição.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid min-h-[calc(100dvh-73px)] md:grid-cols-[3fr_2fr]">
      <fieldset disabled={saving} className="min-w-0 p-6 md:p-10">
        <BackButton onClick={onBack} />
        <h1 className="mt-5 mb-9 text-[32px] font-semibold">Adicionar refeição</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <select required aria-label="Nome da refeição" className={selectField}
            value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="" disabled>Selecionar refeição</option>
            {Object.entries(periods).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select>
          <select required aria-label="Horário da refeição" className={selectField}
            value={time} onChange={(event) => setTime(event.target.value)}>
            <option value="" disabled>Selecionar horário da refeição</option>
            {mealTimes.map((mealTime) => <option key={mealTime}>{mealTime}</option>)}
          </select>
        </div>

        <hr className={divider} />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Adicionar alimentos</h2>
          <details className="relative text-sm">
            <summary className="flex cursor-pointer list-none items-center gap-2">
              Tabelas nutricionais <span className="rounded-full bg-neutral-100 px-2">1</span>
              <Icon file="8c821.svg" size={16} />
            </summary>
            <a className="absolute right-0 z-10 mt-2 whitespace-nowrap rounded-xl border bg-white p-3"
              href="https://nepa.unicamp.br/publicacoes/tabela-taco-excel/">TACO · NEPA/UNICAMP, 4ª edição</a>
          </details>
        </div>
        <div className="relative mb-6">
          <span className="pointer-events-none absolute top-4 left-3"><Icon file="48818.svg" size={16} /></span>
          <input type="search" className={field + " pl-10"} aria-label="Pesquisar alimento por nome"
            placeholder="Pesquisar alimento por nome" value={query} onChange={(event) => changeQuery(event.target.value)} />
          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-[#ddd] bg-white shadow">
              {results.map((food) => (
                <li key={food.id}>
                  <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100"
                    onClick={() => {
                      const newFood: DraftFood = {
                        draftId: nextFoodId.current++,
                        taco_id: food.id,
                        nome: food.nome,
                        medida: "g",
                        quantidade: "",
                      };
                      setFoods((currentFoods) => [newFood, ...currentFoods]);
                      changeQuery("");
                    }}>{food.nome}</button>
                </li>
              ))}
            </ul>
          )}
          {searchMessage && <p role="status" className="mt-2 text-sm">{searchMessage}</p>}
        </div>

        {foods.length > 0 && <>
          <div className="grid gap-4">
            {foods.map((food, index) => (
              <div key={food.draftId} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px] items-end gap-3 lg:grid-cols-[minmax(0,4fr)_minmax(0,1fr)_minmax(7rem,1fr)_40px]">
                <label className="col-span-3 lg:col-span-1"><span className="sr-only">Alimento</span>
                  <input className={field} value={food.nome} readOnly />
                </label>
                <label><span className="sr-only">Medida</span>
                  <select className={selectField} value={food.medida}
                    onChange={(event) => updateFood(index, { medida: event.target.value })}>
                    {measures.map((measure) => <option key={measure}>{measure}</option>)}
                  </select>
                </label>
                <label><span className="sr-only">Quantidade</span>
                  <input type="number" required min="0.01" max="100000" step="any" className={field + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"}
                    placeholder="Quantidade"
                    value={food.quantidade} onChange={(event) => updateFood(index, { quantidade: event.target.value })} />
                </label>
                <button type="button" className="mb-1 cursor-pointer rounded-full hover:bg-[#e2e2e2]" aria-label={`Remover ${food.nome}`}
                  onClick={() => setFoods(foods.filter((_, i) => i !== index))}><Icon file="3af41.svg" size={40} /></button>
              </div>
            ))}
          </div>
        </>}
      </fieldset>

      <aside className="bg-[#f2f2f2] p-6 md:px-10 md:pt-[104px]">
        <h2 className="mb-10 text-2xl font-medium text-[#5b5b5b]">Observação</h2>
        {foods.length > 0 && <>
          <textarea className={fieldStyle + " min-h-28 p-3"}
            aria-label="Adicionar observação" placeholder="Adicionar observação" maxLength={2000}
            disabled={saving} value={notes} onChange={(event) => setNotes(event.target.value)} />
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={saving}
            className="mx-auto mt-9 block h-12 w-full max-w-[304px] rounded-2xl bg-black px-4 font-semibold text-white disabled:opacity-60">
            {saving ? "Salvando..." : "Salvar refeição"}
          </button>
        </>}
      </aside>
    </form>
  );
}

function PlanSummary({ base, userId, planId, onAdd, onBack }: {
  base: string;
  userId: number;
  planId: string;
  onAdd: () => void;
  onBack: () => void;
}) {
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api<{ refeicoes: Meal[] }>(`${base}/meal-plans/${planId}?usuario_id=${userId}`, { signal: controller.signal })
      .then(({ refeicoes }) => { if (!controller.signal.aborted) setMeals(refeicoes); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [base, planId, userId]);

  return (
    <div className="grid min-h-[calc(100dvh-73px)] md:grid-cols-[900fr_636fr]">
      <section className="p-6 md:p-10">
        <BackButton onClick={onBack} />
        <h1 className="mt-5 text-[32px] font-semibold">Adicionar plano alimentar</h1>
        <div className="mt-9 flex flex-wrap gap-6">
          {meals?.map((meal) => (
            <article key={meal.id} className="flex h-[200px] w-full max-w-[256px] flex-col justify-between rounded-[24px] bg-[#ffcaca] p-6 text-[#654444]">
              <time className="text-[32px] font-bold">{meal.horario}</time>
              <p className="text-sm font-medium">{periods[meal.periodo]}</p>
            </article>
          ))}
          {meals && <button type="button" onClick={onAdd}
            className="flex h-[200px] w-full max-w-[256px] items-end justify-between rounded-[24px] border border-[#ddd] p-6 text-sm font-semibold">
            Adicionar refeição <Icon file="ce4db.svg" size={24} />
          </button>}
        </div>
        {error ? <p role="alert" className="text-red-700">{error}</p> : !meals && <p role="status">Carregando plano...</p>}
      </section>
      <aside className="space-y-12 bg-[#f2f2f2] p-6 md:px-10 md:pt-[104px]">
        <h2 className="text-2xl font-medium text-[#5b5b5b]">Resumo do plano</h2>
        {meals?.map((meal) => (
          <section key={meal.id}>
            <h3 className="border-b border-black/20 pb-4 font-semibold">{periods[meal.periodo]}</h3>
            <FoodSummary foods={meal.alimentos} />
            {meal.observacao && <p className="mt-3 whitespace-pre-wrap text-sm">{meal.observacao}</p>}
          </section>
        ))}
      </aside>
    </div>
  );
}

function MealPlan() {
  const router = useRouter();
  const { patientId } = useParams<{ patientId: string }>();
  const search = useSearchParams();
  const usuario = useCurrentUser();
  const planId = search.get("plano");
  const editing = !planId || search.get("refeicao") === "nova";
  const path = `/meal-plan/${encodeURIComponent(patientId)}`;
  const base = `/patients/${encodeURIComponent(patientId)}`;

  if (!usuario) return null;

  return (
    <main className="bg-white">
      <UserGreeting nome={usuario.nome} logo="/meal-plan/a2dc2.png" />
      {editing
        ? <MealEditor key={planId ?? "new"} base={base} userId={usuario.id} planId={planId}
            onSaved={(id) => router.replace(`${path}?plano=${id}`)}
            onBack={() => planId ? router.push(`${path}?plano=${encodeURIComponent(planId)}`) : router.push("/home")} />
        : <PlanSummary key={planId} base={base} userId={usuario.id} planId={planId}
            onAdd={() => router.push(`${path}?plano=${encodeURIComponent(planId)}&refeicao=nova`)}
            onBack={() => router.push("/home")} />}
    </main>
  );
}

export default function MealPlanPage() {
  return <Suspense><MealPlan /></Suspense>;
}
