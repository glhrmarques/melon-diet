import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

it("saves a meal with its household measure and keeps the same plan for the next meal", async () => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8080");
  const fetchMock = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ alimentos: [{ id: 53, nome: "Pão, trigo, francês" }] }))
    .mockResolvedValueOnce(Response.json({ dieta_id: 15 }, { status: 201 }))
    .mockResolvedValueOnce(Response.json({ refeicoes: [{
      id: 1, horario: "07:30", periodo: "cafe_da_manha", observacao: "",
      alimentos: [{ taco_id: 53, nome: "Pão, trigo, francês", medida: "unidade", quantidade: 2, peso_gramas: null }],
    }] }));
  vi.stubGlobal("fetch", fetchMock);
  const { rerender } = render(<MealPlanPage />);

  fireEvent.change(screen.getByLabelText("Nome da refeição"), { target: { value: "cafe_da_manha" } });
  fireEvent.change(screen.getByLabelText("Horário da refeição"), { target: { value: "07:30" } });
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "pao frances" } });
  fireEvent.click(await screen.findByRole("button", { name: "Pão, trigo, francês" }));
  fireEvent.change(screen.getByLabelText("Medida"), { target: { value: "unidade" } });
  fireEvent.change(screen.getByLabelText("Quantidade"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar refeição" }));

  await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/meal-plan/42?plano=15"));
  const [url, request] = fetchMock.mock.calls[1];
  expect(url).toBe("http://localhost:8080/patients/42/plan-meals");
  expect(JSON.parse(request?.body as string)).toMatchObject({
    dieta_id: 0, usuario_id: 7, horario: "07:30",
    alimentos: [{ taco_id: 53, medida: "unidade", quantidade: 2 }],
  });

  navigation.query = "plano=15";
  rerender(<MealPlanPage />);
  expect(await screen.findByText("07:30")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Adicionar refeição" }));
  expect(navigation.push).toHaveBeenCalledWith("/meal-plan/42?plano=15&refeicao=nova");

  navigation.query = "plano=15&refeicao=nova";
  rerender(<MealPlanPage />);
  expect(screen.getByLabelText("Nome da refeição")).toHaveValue("");
  expect(screen.queryByRole("button", { name: "Salvar refeição" })).not.toBeInTheDocument();
});
