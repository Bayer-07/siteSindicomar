import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RichText } from "@/components/rich-text";

describe("RichText", () => {
  it("preserva títulos, ênfase e listas do documento Tiptap", () => {
    render(<RichText content={{ type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Tópicos discutidos" }] },
      { type: "paragraph", content: [{ type: "text", text: "Texto " }, { type: "text", text: "importante", marks: [{ type: "bold" }] }] },
      { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Primeiro item" }] }] }, { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Segundo item" }] }] }] },
    ] }} />);

    expect(screen.getByRole("heading", { name: "Tópicos discutidos" })).toBeInTheDocument();
    expect(screen.getByText("importante").tagName).toBe("STRONG");
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  });
});
