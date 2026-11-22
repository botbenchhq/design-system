import type { Config } from "tailwindcss";
import preset from "../../../dist/tailwind-preset.js";

const surface: string = preset.theme.colors.surface;

export default {
  presets: [preset],
  corePlugins: { preflight: false },
  content: ["./index.html"],
  theme: { extend: { colors: { page: surface } } },
} satisfies Config;
