module.exports = {
  apps: [
    {
      name: "Server",
      script: "node build-server.mjs",
      watch: ["./build/assets.json"],
      // ignore_watch: ['.'],
      autorestart: false,
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "development",
        DATABASE_URL: process.env.DATABASE_URL,
        CLOUDFLARE_IMAGES_TOKEN: process.env.CLOUDFLARE_IMAGES_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      },
    },
    {
      name: "Remix",
      script: "remix watch",
      ignore_watch: ["."],
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "development",
        DATABASE_URL: process.env.DATABASE_URL,
        CLOUDFLARE_IMAGES_TOKEN: process.env.CLOUDFLARE_IMAGES_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      },
    },
    {
      name: "Wrangler",
      script: "npx wrangler pages dev ./public",
      ignore_watch: ["."],
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "development",
        BROWSER: "none",
        DATABASE_URL: process.env.DATABASE_URL,
        CLOUDFLARE_IMAGES_TOKEN: process.env.CLOUDFLARE_IMAGES_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      },
    },
    {
      name: "Prisma",
      script: "prisma generate",
      watch: ["./prisma"],
      autorestart: false,
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "development",
        PRISMA_CLIENT_ENGINE_TYPE: "dataproxy",
      },
    },
    {
      name: "Tailwind",
      script: "tailwindcss -o ./app/tailwind.css --watch",
      ignore_watch: ["."],
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "development",
      },
    },
  ],
}
