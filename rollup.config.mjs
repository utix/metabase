// @ts-check
// rollup.config.mjs
import alias from "@rollup/plugin-alias";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import svgr from "@svgr/rollup";
import postcss from "rollup-plugin-postcss";
import resourceQuery from "rollup-plugin-resource-query";
import nodePolyfills from "rollup-plugin-node-polyfills";

const EXTENSIONS = [".js", ".jsx", ".es6", ".es", ".mjs", ".ts", ".tsx"];

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ASSETS_PATH = __dirname + "/resources/frontend_client/app/assets";
const FONTS_PATH = __dirname + "/resources/frontend_client/app/fonts";
const SRC_PATH = __dirname + "/frontend/src/metabase";
const LIB_SRC_PATH = __dirname + "/frontend/src/metabase-lib";
const ENTERPRISE_SRC_PATH =
  __dirname + "/enterprise/frontend/src/metabase-enterprise";
const SDK_SRC_PATH = __dirname + "/enterprise/frontend/src/embedding-sdk";
const TYPES_SRC_PATH = __dirname + "/frontend/src/metabase-types";
const CLJS_SRC_PATH = __dirname + "/target/cljs_release";
const CLJS_SRC_PATH_DEV = __dirname + "/target/cljs_dev";
const TEST_SUPPORT_PATH = __dirname + "/frontend/test/__support__";
const BUILD_PATH = __dirname + "/resources/frontend_client";
const E2E_PATH = __dirname + "/e2e";

const devMode = false;

const aliases = [
  { find: "assets", replacement: ASSETS_PATH },
  { find: "fonts", replacement: FONTS_PATH },
  { find: "metabase", replacement: SRC_PATH },
  { find: "metabase-lib", replacement: LIB_SRC_PATH },
  { find: "metabase-enterprise", replacement: ENTERPRISE_SRC_PATH },
  { find: "metabase-types", replacement: TYPES_SRC_PATH },
  {
    find: "metabase-dev",
    replacement: `${SRC_PATH}/dev${devMode ? "" : "-noop"}.js`,
  },
  { find: "cljs", replacement: devMode ? CLJS_SRC_PATH_DEV : CLJS_SRC_PATH },
  { find: "__support__", replacement: TEST_SUPPORT_PATH },
  { find: "e2e", replacement: E2E_PATH },
  { find: "style", replacement: SRC_PATH + "/css/core/index" },
  {
    find: "ace",
    replacement: __dirname + "/node_modules/ace-builds/src-noconflict",
  },

  {
    find: "icepick",
    replacement: __dirname + "/node_modules/icepick/icepick.min",
  },
  { find: "ee-plugins", replacement: ENTERPRISE_SRC_PATH + "/plugins" },
  { find: "ee-overrides", replacement: ENTERPRISE_SRC_PATH + "/overrides" },
  { find: "embedding-sdk", replacement: SDK_SRC_PATH },
];

console.log({ __dirname });

export default {
  input: "enterprise/frontend/src/embedding-sdk/components/public/index.ts",
  logLevel: "debug",
  output: {
    dir: "sdk-build",
    format: "esm",
    preserveModules: true,
  },
  external: [/node_modules/],
  plugins: [
    nodePolyfills(),
    commonjs(),
    alias({
      entries: aliases,
    }),
    resolve({ browser: true, extensions: EXTENSIONS }),
    json(),
    typescript({ exclude: "**/*.spec.[tj]sx?" }),
    babel({
      babelHelpers: "bundled",
      extensions: EXTENSIONS,
    }),
    resourceQuery({ resourceQuery: "component" }),
    resourceQuery({ resourceQuery: "source" }),
    svgr({ ref: true }),
    postcss({
      modules: true,
    }),
  ],
};
