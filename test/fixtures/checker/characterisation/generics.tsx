// Type arguments and comparisons are not tags.
import { useState } from "react";

const first = <T,>(items: T[]): T | undefined => items[0];

export function Counter({ limit }: { limit: number }) {
  const [count, setCount] = useState<number>(0);
  const names: Array<Promise<string>> = [];
  const under = count < limit && names.length > 0;
  return (
    <div className="flex gap-sm">
      <span>(optional)</span>
      {under ? <button type="button" onClick={() => setCount(count + 1)}>Add</button> : null}
      <span>{first(["a", "b"]) ?? "none"}</span>
    </div>
  );
}
