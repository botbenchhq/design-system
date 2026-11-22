// The same name used as a class is still a class, and the system has none by that name.
const fallback = "gw-icon-check";

export function Icon({ name }: { name: string }) {
  return <svg className={name ? `gw-icon-${name}` : fallback} aria-hidden="true" />;
}
