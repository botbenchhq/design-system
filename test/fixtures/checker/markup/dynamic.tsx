export function Action({ kind }: { kind: string }) {
  return <button className={`ds-button--${kind}`}>Go</button>;
}
