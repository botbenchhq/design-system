import preset from "../../../dist/tailwind-preset.js";

export default {
  presets: [preset],
  corePlugins: { preflight: false },
  content: ["./index.html"],
};
