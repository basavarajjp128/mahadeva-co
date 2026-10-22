import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage from "@/app/about/page";

describe("about page", () => {
  it("shows the supplied business description and marks the story as editable placeholder content", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "A business focused on coconut copra wholesale trade.",
    );
    expect(screen.getByText("Editable content placeholder")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sourcing details" })).toBeInTheDocument();
  });
});
