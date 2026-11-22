// A link into the icon sprite names a symbol by its id. The id starts with the system prefix and is not a class.
import sprite from "../vendor/groundwork/icons.svg";

type IconName = "check" | "plus";

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="gw-button__icon" aria-hidden="true">
      <use href={`${sprite}#gw-icon-${name}`} />
    </svg>
  );
}

export function Check() {
  const href = "icons.svg#gw-icon-check";
  const built = "/vendor/groundwork/icons.svg#gw-icon-" + "plus";
  return (
    <svg className="gw-button__icon" aria-hidden="true">
      <use href={href} xlinkHref="icons.svg#gw-icon-check" data-other={built} />
    </svg>
  );
}
