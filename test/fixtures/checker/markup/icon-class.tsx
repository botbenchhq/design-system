// The same name used as a class is still a class, and the system has none by that name.
const fallback = "ds-icon-check";

export function Icon({ name }: { name: string }) {
  return <svg className={name ? `ds-icon-${name}` : fallback} aria-hidden="true" />;
}
