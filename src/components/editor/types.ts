export type WorkspaceFileType = "FILE" | "FOLDER";

export type WorkspaceFileItem = {
  id: string;
  name: string;
  path: string;
  type: WorkspaceFileType;
  parentId: string | null;
  content: string | null;
  language: string | null;
  size: number;
};

export type OpenTab = {
  fileId: string;
  name: string;
  path: string;
  language: string;
  isDirty?: boolean;
};

export function detectLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
      return "typescript";
    case "tsx":
      return "typescript";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "jsx":
      return "javascript";
    case "py":
      return "python";
    case "json":
      return "json";
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "scss":
    case "sass":
      return "scss";
    case "md":
    case "markdown":
      return "markdown";
    case "rs":
      return "rust";
    case "go":
      return "go";
    case "java":
      return "java";
    case "c":
    case "h":
      return "c";
    case "cpp":
    case "hpp":
    case "cc":
      return "cpp";
    case "cs":
      return "csharp";
    case "sql":
      return "sql";
    case "sh":
    case "bash":
      return "shell";
    case "yaml":
    case "yml":
      return "yaml";
    case "xml":
    case "svg":
      return "xml";
    case "dockerfile":
      return "dockerfile";
    default:
      return "plaintext";
  }
}
