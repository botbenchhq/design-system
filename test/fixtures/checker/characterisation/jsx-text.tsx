// An apostrophe or a quote in JSX text is text, not the start of a string.
export function Empty() {
  return (
    <main className="flex flex-col gap-md">
      <p>Nothing has run in Botbench's data directory, so "empty" is all there is.</p>
      <p>{`There is no screen at ${window.location.hash}.`}</p>
    </main>
  );
}
