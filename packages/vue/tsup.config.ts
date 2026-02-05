import { defineConfig } from "tsup";
import vuePlugin from "unplugin-vue/esbuild";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: false,
  clean: true,
  sourcemap: true,
  minify: true,
  treeshake: true,
  external: ["vue", "@eimzo/core"],
  esbuildPlugins: [
    vuePlugin(),
  ],
});
