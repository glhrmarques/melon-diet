import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserGreeting } from "./UserGreeting";

describe("UserGreeting", () => {
  it("exibe uma saudação com o nome do usuário", () => {
    render(<UserGreeting nome="Maria" />);

    expect(screen.getByText("Olá, Maria")).toBeInTheDocument();
  });
});
