import esbuild from "esbuild"

import NodeModulesPolyfill from "@esbuild-plugins/node-modules-polyfill"
const { NodeModulesPolyfillPlugin } = NodeModulesPolyfill

import alias from "esbuild-plugin-alias"

import NodeModule from "module"
const { createRequire } = NodeModule

const require = createRequire(import.meta.url)

async function build() {
  const mode = process.env.NODE_ENV
    ? process.env.NODE_ENV.toLowerCase()
    : "development"

  const version = process.env.VERSION
    ? process.env.VERSION
    : new Date().toISOString()

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required")
  }

  if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID is required")
  }

  if (!process.env.CLOUDFLARE_IMAGES_TOKEN) {
    throw new Error("CLOUDFLARE_IMAGES_TOKEN is required")
  }

  console.log(`Building Worker in ${mode} mode for version ${version}`)

  const outfile = "./public/_worker.js"
  const startTime = Date.now()
  const result = await esbuild.build({
    entryPoints: ["./worker/index.ts"],
    bundle: true,
    minify: mode === "production",
    sourcemap: mode !== "production",
    incremental: mode !== "production",
    format: "esm",
    metafile: true,
    external:
      mode === "production"
        ? ["*.development.js"]
        : ["*.production.js", "*.production.min.js"],
    define: {
      process: JSON.stringify({
        env: {
          NODE_ENV: mode,
          VERSION: version,
          DATABASE_URL: process.env.DATABASE_URL,
          CLOUDFLARE_IMAGES_TOKEN: process.env.CLOUDFLARE_IMAGES_TOKEN,
          CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
        },
      }),
    },
    outfile,
    plugins: [
      NodeModulesPolyfillPlugin(),
      alias({
        "@prisma/client": require.resolve("@prisma/client"),
      }),
    ],
  })
  const endTime = Date.now()

  console.log(`Built in ${endTime - startTime}ms`)

  if (mode === "production") {
    console.log(await esbuild.analyzeMetafile(result.metafile))
  }

  process.exit(0)
}

build().catch((e) => console.error("Unknown error caught during build:", e))
