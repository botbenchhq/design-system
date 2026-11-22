// A class helper takes strings, arrays, conditions and objects whose keys are classes.
import clsx from "clsx";

export function Row({ open, wide }: { open: boolean; wide: boolean }) {
  const side = wide ? "right" : "left";
  return (
    <div className={clsx("flex", ["gap-sm", open && "grow"], { hidden: !open, "md:flex-row": wide })} data-side={side}>
      <span className={["min-w-0", wide ? "flex-1" : "shrink-0"].join(" ")}>Row</span>
    </div>
  );
}
