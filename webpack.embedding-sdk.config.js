const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const path = require("path");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const ASSETS_PATH = __dirname + "/resources/frontend_client/app/assets";
const FONTS_PATH = __dirname + "/resources/frontend_client/app/fonts";
const SDK_SRC_PATH = __dirname + "/frontend/src/embedding-sdk";
const SRC_PATH = __dirname + "/frontend/src/metabase";
const LIB_SRC_PATH = __dirname + "/frontend/src/metabase-lib";
const ENTERPRISE_SRC_PATH =
  __dirname + "/enterprise/frontend/src/metabase-enterprise";
const TYPES_SRC_PATH = __dirname + "/frontend/src/metabase-types";
const CLJS_SRC_PATH = __dirname + "/target/cljs_release";
const CLJS_SRC_PATH_DEV = __dirname + "/target/cljs_dev";
const TEST_SUPPORT_PATH = __dirname + "/frontend/test/__support__";
const BUILD_PATH = __dirname + "/resources/embedding-sdk";
const E2E_PATH = __dirname + "/e2e";
const SHARED_SRC = path.join(__dirname, "frontend", "src", "metabase-shared");

// default WEBPACK_BUNDLE to development
const WEBPACK_BUNDLE = process.env.WEBPACK_BUNDLE || "development";
const devMode = WEBPACK_BUNDLE !== "production";

// Babel:
const BABEL_CONFIG = {
  cacheDirectory: process.env.BABEL_DISABLE_CACHE ? false : ".babel_cache",
};

const shouldAnalyzeBundles = process.env.SHOULD_ANALYZE_BUNDLES === "true";

// TODO: Add types generation for SDK

module.exports = env => {
  const shouldDisableMinimization = env.WEBPACK_WATCH === true;

  return {
    // TODO: make this configurable
    // mode: "production",
    mode: "development",
    context: SDK_SRC_PATH,

    performance: {
      hints: false,
    },

    entry: "./index.ts",

    output: {
      path: BUILD_PATH + "/dist",
      publicPath: "",
      filename: "[name].bundle.js",
      libraryTarget: "commonjs2",
      globalObject: "{}",
    },

    module: {
      rules: [
        {
          test: /\.(tsx?|jsx?)$/,
          exclude: /node_modules|cljs/,
          use: [{ loader: "babel-loader", options: BABEL_CONFIG }],
        },
        {
          test: /\.(eot|woff2?|ttf|svg|png)$/,
          type: "asset/resource",
          resourceQuery: { not: [/component|source/] },
        },
        // TODO: this should be enabled only in dev mode
        {
          test: /\.js$/,
          exclude: /node_modules/,
          enforce: "pre",
          use: ["source-map-loader"],
        },
        {
          test: /\.svg/,
          type: "asset/source",
          resourceQuery: /source/, // *.svg?source
        },
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          resourceQuery: /component/, // *.svg?component
          use: [
            {
              loader: "@svgr/webpack",
              options: {
                ref: true,
              },
            },
          ],
        },
      ],
    },

    resolve: {
      extensions: [
        ".webpack.js",
        ".web.js",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".css",
        ".svg",
      ],
      alias: {
        d3: path.join(
            SHARED_SRC,
            "dependencies",
            "d3.js",
        ),
        assets: ASSETS_PATH,
        fonts: FONTS_PATH,
        metabase: SRC_PATH,
        "metabase-lib": LIB_SRC_PATH,
        "metabase-enterprise": ENTERPRISE_SRC_PATH,
        "metabase-types": TYPES_SRC_PATH,
        "metabase-dev": `${SRC_PATH}/dev${devMode ? "" : "-noop"}.js`,
        cljs: devMode ? CLJS_SRC_PATH_DEV : CLJS_SRC_PATH,
        __support__: TEST_SUPPORT_PATH,
        e2e: E2E_PATH,
        style: SRC_PATH + "/css/core/index",
        ace: __dirname + "/node_modules/ace-builds/src-noconflict",
        // NOTE @kdoh - 7/24/18
        // icepick 2.x is es6 by defalt, to maintain backwards compatability
        // with ie11 point to the minified version
        icepick: __dirname + "/node_modules/icepick/icepick.min",
        // conditionally load either the EE plugins file or a empty file in the CE code tree
        "ee-plugins":
          process.env.MB_EDITION === "ee"
            ? ENTERPRISE_SRC_PATH + "/plugins"
            : SRC_PATH + "/lib/noop",
        "ee-overrides":
          process.env.MB_EDITION === "ee"
            ? ENTERPRISE_SRC_PATH + "/overrides"
            : SRC_PATH + "/lib/noop",
      },
    },

    externals: {
      react: {
        commonjs: "react",
        commonjs2: "react",
        amd: "React",
        root: "React",
      },
      "react-dom": {
        commonjs: "react-dom",
        commonjs2: "react-dom",
        amd: "ReactDOM",
        root: "ReactDOM",
      },
      "react/jsx-runtime": "react/jsx-runtime",
    },

    // optimization: {
    //   minimize: !shouldDisableMinimization,
    //   minimizer: [
    //     new TerserPlugin({
    //       minify: TerserPlugin.swcMinify,
    //     }),
    //   ],
    // },
    plugins: [
      new NodePolyfillPlugin(), // for crypto, among others
      // https://github.com/remarkjs/remark/discussions/903
      new webpack.ProvidePlugin({ process: "process/browser.js" }),
      new webpack.IgnorePlugin({
        resourceRegExp: /\.css$/, // regular expression to ignore all CSS files
        contextRegExp: /./,
      }),
      shouldAnalyzeBundles &&
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          reportFilename: BUILD_PATH + "/dist/report.html",
        }),
    ].filter(Boolean),
  };
};
