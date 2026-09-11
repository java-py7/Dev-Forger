"use client";

import { useRef, useEffect } from "react";
import Editor, { OnMount, loader } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Code2, FileCode, Keyboard } from "lucide-react";
import { WorkspaceFileItem } from "./types";

interface CodeEditorProps {
  file: WorkspaceFileItem | null;
  content: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

export function CodeEditor({
  file,
  content,
  onChange,
  onSave,
  readOnly = false,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<any>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const editorTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add Ctrl+S / Cmd+S save action
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSaveRef.current) {
        onSaveRef.current();
      }
    });
  };

  if (!file) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-background/50 p-6 text-center select-none">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60 border shadow-xs mb-4 text-primary">
          <Code2 className="size-8" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          No file selected
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Select a file from the explorer on the left or create a new file to start coding.
        </p>

        <div className="mt-6 flex flex-col gap-2 rounded-xl border bg-card/60 p-4 text-xs text-muted-foreground w-full max-w-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Keyboard className="size-3.5" />
              <span>Save file</span>
            </span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold border">
              Ctrl+S
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileCode className="size-3.5" />
              <span>Run script</span>
            </span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold border">
              Click Run
            </kbd>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <Editor
        height="100%"
        width="100%"
        path={file.path}
        language={file.language || "plaintext"}
        value={content}
        theme={editorTheme}
        onChange={(value) => onChange(value || "")}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex h-full w-full items-center justify-center bg-background text-sm text-muted-foreground">
            Loading editor...
          </div>
        }
        options={{
          readOnly,
          minimap: { enabled: true, scale: 0.75 },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
          fontLigatures: true,
          tabSize: 2,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          lineNumbers: "on",
          renderLineHighlight: "all",
          bracketPairColorization: { enabled: true },
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
