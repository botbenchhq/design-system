// Class strings held in a lookup table are read; its keys and the values compared against are not.
type Kind = "added" | "removed" | "context";
const LINE_CLASS = { added: "p-sm", removed: "p-xs", context: "" } as const;

function kindOf(line: string): Kind {
  if (line.startsWith("+") || /^(new|deleted) file mode /.test(line)) return "added";
  return line.startsWith("-") ? "removed" : "context";
}

export function Diff({ lines, current }: { lines: string[]; current: string }) {
  return (
    <pre className="w-full">
      {lines.map((line, i) => {
        const kind = kindOf(line);
        return (
          <span key={i} data-line={kind} className={`block ${LINE_CLASS[kind]} ${line === current ? "grow" : "shrink"}`}>
            {line === "" ? " " : line}
          </span>
        );
      })}
    </pre>
  );
}
