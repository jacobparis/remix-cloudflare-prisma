import "@remix-run/cloudflare-pages"
import type {
  AppLoadContext,
  ServerBuild,
  ServerPlatform,
} from "@remix-run/server-runtime"
import {
  createRequestHandler as createRemixRequestHandler,
  redirect,
} from "@remix-run/server-runtime"

export interface GetLoadContextFunction<Env = unknown> {
  (request: Request, env: Env, ctx: ExecutionContext): AppLoadContext
}

export type RequestHandler = ReturnType<typeof createRequestHandler>

export function createRequestHandler<Env>({
  build,
  getLoadContext,
  mode,
}: {
  build: ServerBuild
  getLoadContext?: GetLoadContextFunction
  mode?: string
}): ExportedHandlerFetchHandler<Env> {
  const platform: ServerPlatform = {}
  const handleRequest = createRemixRequestHandler(build, platform, mode)

  return (request: Request, env: Env, ctx: ExecutionContext) => {
    const requestUrl = new URL(request.url)

    if (requestUrl.hostname === "127.0.0.1") {
      requestUrl.hostname = "localhost"

      return redirect(requestUrl.toString())
    }

    const loadContext =
      typeof getLoadContext === "function"
        ? getLoadContext(request, env, ctx)
        : undefined

    return handleRequest(request, loadContext)
  }
}

export function createFetchHandler<Env>({
  build,
  getLoadContext,
  mode,
  getCache,
}: {
  build: ServerBuild
  getLoadContext?: GetLoadContextFunction
  mode?: string
  getCache?: () => Promise<Cache>
}): ExportedHandlerFetchHandler<Env> {
  const handleRequest = createRequestHandler({
    build,
    getLoadContext,
    mode,
  })

  const handleAsset = async (
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ) => {
    const clonedRequest = newRequest(request, (headers) => {
      headers.delete("If-None-Match")

      return headers
    })

    const response = await (env as any).ASSETS.fetch(
      clonedRequest.url,
      clonedRequest
    )

    return response.ok ? new Response(response.body, response) : null
  }

  return async (request: Request, env: Env, ctx: ExecutionContext) => {
    try {
      const isHeadOrGetRequest =
        request.method === "HEAD" || request.method === "GET"
      const cache = typeof getCache !== "undefined" ? await getCache() : null
      let response
      if (isHeadOrGetRequest) {
        response = await handleAsset(request, env, ctx)
      }
      if (response) {
        return response
      }

      if (isHeadOrGetRequest) {
        response = await cache?.match(request)
      }

      if (!response) {
        response = await handleRequest(request, env, ctx)
      }
      if (isHeadOrGetRequest) {
        ctx.waitUntil(cache?.put(request, response.clone()))
      }

      return response
    } catch (e: any) {
      if (process.env.NODE_ENV === "development" && e instanceof Error) {
        return new Response(e.message || e.toString(), {
          status: 500,
        })
      }

      // Production response: you may want to display "Internal Error"
      // Instead of exposing the real error message
      return new Response(e.message || e.toString(), {
        status: 500,
      })
    }
  }
}

function newRequest(request, headerFn): Request {
  function cloneHeaders() {
    const headers = new Headers()
    for (const kv of request.headers.entries()) {
      headers.append(kv[0], kv[1])
    }
    return headers
  }

  const headers = headerFn ? headerFn(cloneHeaders()) : request.headers

  return new Request(request.url, {
    ...request,
    headers: headers,
  })
}
