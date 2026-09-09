import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

import { useCurrentUser } from "./useCurrentUser";

describe("useCurrentUser", () => {
  beforeEach(() => {
    localStorage.clear();
    router.replace.mockClear();
  });

  it("retorna o usuário salvo na sessão", async () => {
    const usuario = {
      id: 1,
      nome: "Maria",
      email: "maria@example.com",
      tipo: "nutricionista",
    };
    localStorage.setItem("usuario", JSON.stringify(usuario));

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current).toEqual(usuario));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("redireciona ao login quando não há sessão", async () => {
    renderHook(() => useCurrentUser());

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/auth/login"));
  });
});
