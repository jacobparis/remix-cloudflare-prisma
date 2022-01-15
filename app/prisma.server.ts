import type { User, Session, Card } from "@prisma/client"
import { PrismaClient } from "@prisma/client"
import MongoURI, { MongoUriBuilderConfig } from "mongo-uri-builder"

const primaryDB: Partial<MongoUriBuilderConfig> = {
  username: "admin",
  password: "password",
  host: "localhost",
  port: 27017,
  database: "db",
}

const isLocalHost = primaryDB.host === "localhost"

const logThreshold = 50

function getClient(type: "write" | "read"): PrismaClient {
  const connectionUrl = primaryDB
  console.log(`Setting up Prisma client to ${connectionUrl.host} for ${type}`)
  // NOTE: during development if you change anything in this function, remember
  // that this only runs once per server restart and won't automatically be
  // re-run per request like everything else is.
  const client = new PrismaClient({
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "stdout" },
      { level: "info", emit: "stdout" },
      { level: "warn", emit: "stdout" },
    ],
    datasources: {
      db: {
        url: `${MongoURI(connectionUrl)}?authSource=admin&retryWrites=false`,
      },
    },
  })
  client.$on("query", (e) => {
    if (e.duration < logThreshold) return

    console.log(`prisma:query - ${e.duration}ms - ${e.query}`)
  })
  // make the connection eagerly so the first request doesn't have to wait
  void client.$connect()
  return client
}

const isProd = process.env.NODE_ENV === "production"

if (!isProd && !isLocalHost) {
  // if we're connected to a non-localhost db, let's make
  // sure we know it.
  const cleanDbConfig = {
    ...primaryDB,
  }
  if (cleanDbConfig.password) {
    cleanDbConfig.password = "**************"
  }
  console.warn(
    `
⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️
Connected to non-localhost DB in dev mode:
  ${MongoURI(cleanDbConfig)}?authSource=admin&retryWrites=false
⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️
    `.trim()
  )
}

const linkExpirationTime = 1000 * 60 * 30
const sessionExpirationTime = 1000 * 60 * 60 * 24 * 365

export { linkExpirationTime, sessionExpirationTime, getClient }
