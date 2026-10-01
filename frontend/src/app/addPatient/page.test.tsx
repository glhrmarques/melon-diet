import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AddPatient from "./page";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ id: 7, nome: "Nutricionista", email: "nutri@example.com", tipo: "nutricionista" }),
}));

const fetchMock = vi.fn<typeof fetch>();
const success = () => new Response(JSON.stringify({ paciente: { id: 42 } }), { status: 201 });

function fillForm() {
  render(<AddPatient />);
  const values = {
    Nome: " Ana Silva ",
    "Data de nascimento": "1995-04-20",
    Sexo: "Feminino",
    "Altura (m)": "1.68",
    "Peso (kg)": "64.5",
    "E-mail": "ana@example.com",
  };
  for (const [label, value] of Object.entries(values)) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  return screen.getByRole("button", { name: "Confirmar cadastro" });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8080");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("patient registration", () => {
  it("sends normalized data and navigates after creation", async () => {
    fetchMock.mockResolvedValue(success());
    fireEvent.click(fillForm());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/home"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8080/patients?usuario_id=7");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(options?.body as string)).toEqual({
      nome: "Ana Silva", data_nascimento: "1995-04-20", sexo: "Feminino",
      altura_cm: 168, peso_kg: 64.5, email: "ana@example.com",
    });
  });

  it("disables submission while pending and blocks repeated submit events", async () => {
    let resolve!: (value: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((done) => { resolve = done; }));
    const button = fillForm();
    const form = button.closest("form")!;
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Cadastrando..." })).toBeDisabled();
    fireEvent.submit(form);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
    await act(async () => resolve(success()));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/home"));
  });

  it("shows the API error, preserves input, and allows retry", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Data de nascimento inválida" }), { status: 400 }));
    fireEvent.click(fillForm());
    expect(await screen.findByRole("alert")).toHaveTextContent("Data de nascimento inválida");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nome")).toHaveValue(" Ana Silva ");
    expect(screen.getByLabelText("E-mail")).toHaveValue("ana@example.com");
    const button = screen.getByRole("button", { name: "Confirmar cadastro" });
    expect(button).toBeEnabled();
    fetchMock.mockResolvedValueOnce(success());
    fireEvent.click(button);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/home"));
  });

  it("handles network failure without losing the form", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    fireEvent.click(fillForm());
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível cadastrar o paciente");
    expect(screen.getByRole("button", { name: "Confirmar cadastro" })).toBeEnabled();
    expect(screen.getByLabelText("Altura (m)")).toHaveValue(1.68);
    expect(push).not.toHaveBeenCalled();
  });

  it("handles a non-JSON server error", async () => {
    fetchMock.mockResolvedValue(new Response("Service unavailable", { status: 503 }));
    fireEvent.click(fillForm());
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível cadastrar o paciente");
    expect(push).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only name before sending a request", async () => {
    const button = fillForm();
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "   " } });
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent("Confira o nome");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires valid fields and permits decimal height and weight", () => {
    const button = fillForm();
    const form = button.closest("form")!;
    expect(form.checkValidity()).toBe(true);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invalid" } });
    expect(form.checkValidity()).toBe(false);
    fireEvent.click(button);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
