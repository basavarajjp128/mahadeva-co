import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("project homepage placeholder", () => {
  it("identifies the business without making unverified claims", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "SRI MAHADEVA & CO" }),
    ).toBeInTheDocument();
  });
});
