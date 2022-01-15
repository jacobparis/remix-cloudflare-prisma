// Worker

export default {
  async fetch(request, env) {
    return await handleRequest(request, env)
  },
}

async function handleRequest(request, env) {
  const id = env.SESSION_STORAGE.idFromName("A")
  const obj = env.SESSION_STORAGE.get(id)
  const resp = await obj.fetch(request.url)
  const value = await resp.text()

  return new Response("Session storage 'A' value: " + value)
}

// This magical key stores the expiration Date instance, if given.
const EXPIRES_KEY = "__expires"

export class SessionStorageDurableObject {
  constructor(state) {
    this.storage = state.storage
  }

  async fetch(request) {
    switch (request.method.toLowerCase()) {
      case "get": {
        const dataMap = await this.storage.list()
        const expires = dataMap.get(EXPIRES_KEY)

        if (expires && expires < new Date()) {
          await this.storage.deleteAll()
          return new Response(JSON.stringify(null))
        }

        if (dataMap.size === 0 || (expires !== undefined && dataMap.size === 1))
          return new Response(JSON.stringify(null))

        const entries = [...dataMap.entries()].filter(
          ([key]) => key !== EXPIRES_KEY
        )

        return new Response(JSON.stringify(Object.fromEntries(entries)))
      }
      case "post": {
        const { data, expires } = await request.json()

        if (EXPIRES_KEY in data) {
          throw new Error(
            `"${EXPIRES_KEY}" is a protected key and cannot be used directly in the session data. Set it using the "expires" option of commitSession().`
          )
        }

        await this.storage.deleteAll()
        if (expires !== undefined) await this.storage.put(EXPIRES_KEY, expires)
        await this.storage.put(data)

        return new Response()
      }
      case "delete": {
        await this.storage.deleteAll()
        return new Response()
      }
    }

    return new Response(null, { status: 405 })
  }
}
