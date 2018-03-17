process.traceDeprecation = true
const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const HtmlWebpackTemplate = require("html-webpack-template")
const webpack = require("webpack")
const merge = require("webpack-merge")
// const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin')
const OfflinePlugin = require("offline-plugin")
const parts = require("./webpack.parts")
const isProduction = process.argv.indexOf("-p") >= 0

const PATHS = {
  app: path.join(__dirname, "src"),
  build: path.join(__dirname, '../',"tmp")
}

const common = merge([
  {
    // Entry accepts a path or an object of entries. We'll be using the latter form
    // given it's convenient with more complex configurations.
    //
    // Entries have to resolve to files! It relies on Node.js convention by default
    // so if a directory contains *index.js*, it will resolve to that.
    entry: {
      app: PATHS.app
    },
    output: {
      path: PATHS.build,
      filename: "[name].[hash].js",
      publicPath: "/"
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "template.html",
        title: "Tools后台管理系统",
        minify: {
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeEmptyAttributes: true
        },
        appMountId: "app", // Generate #app where to mount
        favicon: "favicon.png",
        mobile: true, // Scale page on mobile
        inject: true // html-webpack-template requires this to work
      })
      //   new OfflinePlugin({
      //     externals: ["https://at.alicdn.com/t/font_zck90zmlh7hf47vi.woff"]
      //   })
    ],
    resolve: {
      extensions: [".js", ".ts", ".tsx", ".css"],
      mainFields: ["module", "browser", "main"]
      //   alias: {
      //     shared: path.resolve(__dirname, "src/appSettings"),
      //     assets: path.resolve(__dirname, "src/assets"),
      //     utils: path.resolve(__dirname, "src/utils"),
      //     modules: path.resolve(__dirname, "src/routes"),
      //     layouts: path.resolve(__dirname, "src/layouts"),
      //     constants: path.resolve(__dirname, "src/constants"),
      //     store: path.resolve(__dirname, "src/model/store")
      //   }
    }
  },
  parts.loadTsx(),
  parts.loadImages({
    options: {
      limit: 15000
    }
  }),
  parts.loadFonts(),
  parts.extractCSS({
    use: ["css-loader?modules", parts.autoprefix()]
  })
  //   parts.loadJavaScript({ include: PATHS.app })
])

module.exports = function() {
  if (isProduction) {
    return merge([
      common,
      {
        output: {
          chunkFilename: "scripts/[chunkhash].js",
          filename: "[name].[chunkhash].js"
        },
        plugins: [
          new webpack.HashedModuleIdsPlugin(),
          new webpack.optimize.AggressiveMergingPlugin(),
          new webpack.optimize.ModuleConcatenationPlugin()
        ]
      },
      parts.clean(PATHS.build),
      parts.setFreeVariable("process.env.NODE_ENV", "production"),
      parts.minifyJavaScript({ useSourceMap: true }),
      parts.extractBundles({
        bundles: [
          {
            name: "vendor",
            entries: [
              "react",
              "react-router",
              "react-dom",
              "mobx",
              "mobx-react",
              "mobx-react-router",
              "antd",
              "axios",
              "url-search-params-polyfill"
            ]
          },
          {
            name: "manifest"
          }
        ]
      }),

      parts.generateSourceMaps({ type: "hidden-source-map" }),
      // parts.loadCSS(),
      parts.minifyCSS({
        options: {
          discardComments: {
            removeAll: true
          },
          // Run cssnano in safe mode to avoid potentially unsafe transformations.
          safe: true
        }
      })
    ])
  }
  return merge([
    common,
    {
      plugins: [new webpack.NamedModulesPlugin()]
    },
    parts.generateSourceMaps({ type: "cheap-module-eval-source-map" }),
    parts.devServer({
      // Customize host/port here if needed
      src: PATHS.app,
      host: process.env.HOST,
      port: process.env.PORT
    })
    // parts.extractCSS({use: 'css-loader?modules'})
    // parts.loadCSS()
  ])
}
