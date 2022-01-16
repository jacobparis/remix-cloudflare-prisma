import { ActionFunction, LoaderFunction, redirect } from "remix"

export const action: ActionFunction = async ({ request, context }) => {
  const { destroySession, getSession } = context.sessionStorage

  const session = await getSession(request.headers.get("Cookie"))

  return redirect("/auth/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  })
}

export const loader: LoaderFunction = () => {
  // This is an action only route, so redirect GET requests
  return redirect("/triage")
}
