"use client";

import { Bold, Heading2, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useState } from "react";

const initialContent = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Digite ou cole o conteúdo aprovado aqui." }] }] };

function contentOrDefault(value: JSONContent | null | undefined) {
  return value && typeof value === "object" && value.type ? value : { type: "doc", content: [] };
}

export function TiptapEditor({ value, onChange }: { value?: JSONContent | null; onChange?: (value: JSONContent) => void }) {
  const [saved, setSaved] = useState(false);
  const startingContent = useMemo(() => value === undefined ? initialContent : contentOrDefault(value), [value]);
  const editor = useEditor({ extensions: [StarterKit], content: startingContent, immediatelyRender: false, onUpdate: ({ editor: currentEditor }) => { onChange?.(currentEditor.getJSON()); setSaved(false); } });

  useEffect(() => {
    if (!editor || value === undefined) return;
    const nextContent = contentOrDefault(value);
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(nextContent)) editor.commands.setContent(nextContent, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;
  const buttons = [
    { label: "Desfazer", icon: Undo2, active: false, action: () => editor.chain().focus().undo().run() },
    { label: "Refazer", icon: Redo2, active: false, action: () => editor.chain().focus().redo().run() },
    { label: "Negrito", icon: Bold, active: editor.isActive("bold"), action: () => editor.chain().focus().toggleBold().run() },
    { label: "Itálico", icon: Italic, active: editor.isActive("italic"), action: () => editor.chain().focus().toggleItalic().run() },
    { label: "Título", icon: Heading2, active: editor.isActive("heading", { level: 2 }), action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Lista", icon: List, active: editor.isActive("bulletList"), action: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Lista numerada", icon: ListOrdered, active: editor.isActive("orderedList"), action: () => editor.chain().focus().toggleOrderedList().run() },
  ];
  return <div className="editor-shell"><div className="editor-toolbar">{buttons.map(({ label, icon: Icon, active, action }) => <button key={label} type="button" className={active ? "active" : ""} onClick={action} aria-label={label} title={label}><Icon size={17} /></button>)}</div><EditorContent editor={editor} /><div className="editor-footer"><span>{onChange ? "O conteúdo será salvo junto com o registro." : saved ? "Rascunho salvo nesta sessão" : "Alterações não salvas"}</span>{!onChange && <button className="button button-secondary" type="button" onClick={() => setSaved(true)}>Salvar rascunho</button>}</div></div>;
}
