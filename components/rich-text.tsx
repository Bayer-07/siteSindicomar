import { Fragment, type ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";

export function RichText({ content }: { content?: JSONContent | null }) {
  const blocks = content?.content ?? [];
  if (!blocks.length) return null;

  return <div className="rich-content">{blocks.map((node, index) => renderBlock(node, `block-${index}`))}</div>;
}

function renderBlock(node: JSONContent, key: string): ReactNode {
  const children = node.content ?? [];

  switch (node.type) {
    case "paragraph":
      return <p key={key}>{renderInline(children, key)}</p>;
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 2)));
      const content = renderInline(children, key);
      if (level === 1) return <h1 key={key}>{content}</h1>;
      if (level === 3) return <h3 key={key}>{content}</h3>;
      if (level === 4) return <h4 key={key}>{content}</h4>;
      if (level === 5) return <h5 key={key}>{content}</h5>;
      if (level === 6) return <h6 key={key}>{content}</h6>;
      return <h2 key={key}>{content}</h2>;
    }
    case "bulletList":
      return <ul key={key}>{children.map((child, index) => renderListItem(child, `${key}-${index}`))}</ul>;
    case "orderedList":
      return <ol key={key}>{children.map((child, index) => renderListItem(child, `${key}-${index}`))}</ol>;
    case "blockquote":
      return <blockquote key={key}>{children.map((child, index) => renderBlock(child, `${key}-${index}`))}</blockquote>;
    case "codeBlock":
      return <pre key={key}><code>{inlineText(children)}</code></pre>;
    case "horizontalRule":
      return <hr key={key} />;
    default:
      return <Fragment key={key}>{children.map((child, index) => renderBlock(child, `${key}-${index}`))}</Fragment>;
  }
}

function renderListItem(node: JSONContent, key: string) {
  return <li key={key}>{(node.content ?? []).map((child, index) => renderBlock(child, `${key}-${index}`))}</li>;
}

function renderInline(nodes: JSONContent[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-inline-${index}`;
    let result: ReactNode = node.type === "hardBreak"
      ? <br key={key} />
      : typeof node.text === "string"
        ? node.text
        : renderInline(node.content ?? [], key);

    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") result = <strong key={`${key}-bold`}>{result}</strong>;
      if (mark.type === "italic") result = <em key={`${key}-italic`}>{result}</em>;
      if (mark.type === "strike") result = <s key={`${key}-strike`}>{result}</s>;
      if (mark.type === "code") result = <code key={`${key}-code`}>{result}</code>;
      if (mark.type === "link") {
        const href = safeHref(String(mark.attrs?.href ?? ""));
        if (href) result = <a key={`${key}-link`} href={href} target="_blank" rel="noreferrer">{result}</a>;
      }
    }

    return <Fragment key={key}>{result}</Fragment>;
  });
}

function inlineText(nodes: JSONContent[]): string {
  return nodes.map((node) => typeof node.text === "string" ? node.text : inlineText(node.content ?? [])).join("");
}

function safeHref(value: string) {
  return /^(https?:|mailto:|tel:)/i.test(value) ? value : "";
}
