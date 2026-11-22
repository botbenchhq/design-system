// Names that hold the letters gw but not the old prefix.
const logwriter = "https://example.com/gwen/logs";
const name = "my-gw-thing";
const gap = "--gwx-gap";
export const Panel = () => <p className="ds-stack" title={logwriter + name + gap}>Logs</p>;
