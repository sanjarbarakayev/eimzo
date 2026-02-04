import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    crypto: "src/crypto/index.ts",
    i18n: "src/i18n/index.ts",
    mobile: "src/mobile/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true,
  treeshake: true,
});
