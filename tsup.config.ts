import { defineConfig } from "tsup";

export default defineConfig((_options) => {
  return {
    entry: ["./src/index.ts", "./publicodes-build/index.js"],
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    cjsInterop: true,
    splitting: true,
    treeshake: true,
  };
});
