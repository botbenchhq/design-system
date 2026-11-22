export function Action({ kind }: { kind: string }) {
  return <button className={`gw-button--${kind}`}>Go</button>;
}
