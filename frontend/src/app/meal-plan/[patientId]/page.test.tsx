import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import MealPlanPage from "./page";

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), query: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useParams: () => ({ patientId: "42" }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));
vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ id: 7, nome: "Nutricionista" }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  navigation.query = "";
  vi.clearAllMocks();
});

it("keeps meals in a draft until the plan is saved", async () => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8080");
  const fetchMock = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ alimentos: [{ id: 53, nome: "Pão, trigo, francês" }] }))
    .mockResolvedValueOnce(Response.json({ alimentos: [{ id: 2, nome: "Arroz" }] }))
    .mockResolvedValueOnce(Response.json({ dieta_id: 15 }, { status: 201 }))
    .mockResolvedValueOnce(Response.json({ refeicoes: [{
      id: 1, horario: "07:30", periodo: "cafe_da_manha", observacao: "",
      alimentos: [{ taco_id: 53, nome: "Pão, trigo, francês", medida: "unidade", quantidade: 2, peso_gramas: null }],
    }] }));
  vi.stubGlobal("fetch", fetchMock);
  const { rerender } = render(<MealPlanPage />);

  expect(screen.getByRole("button", { name: "Salvar refeição" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Adicionar observação"), { target: { value: "Servir quente" } });
  fireEvent.change(screen.getByLabelText("Nome da refeição"), { target: { value: "cafe_da_manha" } });
  fireEvent.change(screen.getByLabelText("Horário da refeição"), { target: { value: "07:30" } });
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "pao frances" } });
  fireEvent.click(await screen.findByRole("button", { name: "Pão, trigo, francês" }));
  expect(screen.getByRole("button", { name: "Salvar refeição" })).toBeEnabled();
  fireEvent.change(screen.getByLabelText("Medida"), { target: { value: "unidade" } });
  fireEvent.change(screen.getByLabelText("Quantidade"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar refeição" }));

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const card = screen.getByRole("article");
  expect(within(card).getByText("07:30")).toBeVisible();
  expect(within(card).getByText("Café da manhã")).toBeVisible();
  const summary = screen.getByRole("region", { name: "Resumo do plano" });
  expect(within(summary).getByText("Pão, trigo, francês")).toBeVisible();
  expect(within(summary).getByRole("listitem")).toHaveTextContent("2 unidade");

  fireEvent.click(screen.getByRole("button", { name: "Adicionar refeição" }));
  expect(screen.getByLabelText("Nome da refeição")).toHaveValue("");
  expect(screen.getByRole("button", { name: "Salvar refeição" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Nome da refeição"), { target: { value: "almoco" } });
  fireEvent.change(screen.getByLabelText("Horário da refeição"), { target: { value: "12:30" } });
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "arroz" } });
  fireEvent.click(await screen.findByRole("button", { name: "Arroz" }));
  fireEvent.change(screen.getByLabelText("Quantidade"), { target: { value: "200" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar refeição" }));

  expect(fetchMock).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Salvar plano alimentar" }));
  expect(await screen.findByRole("heading", { name: "Plano alimentar salvo com sucesso" })).toBeVisible();
  expect(screen.getAllByRole("article")).toHaveLength(2);
  const [url, request] = fetchMock.mock.calls[2];
  expect(url).toBe("http://localhost:8080/patients/42/meal-plans");
  expect(request?.method).toBe("POST");
  expect(JSON.parse(request?.body as string)).toMatchObject({
    dieta_id: 0, usuario_id: 7,
    refeicoes: [
      {
        periodo: "cafe_da_manha", horario: "07:30", observacao: "Servir quente",
        alimentos: [{ taco_id: 53, medida: "unidade", quantidade: 2 }],
      },
      {
        periodo: "almoco", horario: "12:30",
        alimentos: [{ taco_id: 2, medida: "g", quantidade: 200 }],
      },
    ],
  });

  fireEvent.click(screen.getByRole("button", { name: "Ver dieta" }));
  expect(navigation.replace).toHaveBeenCalledWith("/meal-plan/42?plano=15");
  navigation.query = "plano=15";
  rerender(<MealPlanPage />);
  expect(await screen.findByText("07:30")).toBeVisible();
});
