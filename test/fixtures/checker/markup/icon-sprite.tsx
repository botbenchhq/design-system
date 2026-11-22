// A link into the icon sprite names a symbol by its id. The id starts with the system prefix and is not a class.
import sprite from "../vendor/design-system/icons.svg";

type IconName = "check" | "plus";

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="ds-button__icon" aria-hidden="true">
      <use href={`${sprite}#ds-icon-${name}`} />
    </svg>
  );
}

export function Check() {
  const href = "icons.svg#ds-icon-check";
  const built = "/vendor/design-system/icons.svg#ds-icon-" + "plus";
  return (
    <svg className="ds-button__icon" aria-hidden="true">
      <use href={href} xlinkHref="icons.svg#ds-icon-check" data-other={built} />
    </svg>
  );
}
