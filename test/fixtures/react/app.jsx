// A screen whose primary buttons are not visible in any one file: they come from a wrapper
// component and from a mapped list of actions. Only the rendered page shows there are two.

import { createRoot } from "react-dom/client";

const ACTIONS = [
  { id: "save", label: "Save" },
  { id: "publish", label: "Publish" },
];

function Button({ emphasis = "secondary", children }) {
  const classes = emphasis === "primary" ? "gw-button gw-button--primary" : "gw-button";
  return (
    <button type="button" className={classes}>
      {children}
    </button>
  );
}

const PrimaryButton = (props) => <Button emphasis="primary" {...props} />;

function Toolbar() {
  return (
    <div className="gw-cluster">
      <Button>Preview</Button>
      {ACTIONS.map((action) => (
        <PrimaryButton key={action.id}>{action.label}</PrimaryButton>
      ))}
    </div>
  );
}

function App() {
  return (
    <main className="gw-container gw-stack">
      <div className="gw-split">
        <h1>Draft</h1>
        <Toolbar />
      </div>
      <p>Edited a minute ago.</p>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
