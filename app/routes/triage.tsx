/**
 * This triage route looks up a user and sends them where they need to be
 */

import { LoaderFunction, redirect } from "remix"
import { getAuthenticator } from "~/auth.server"

export const loader: LoaderFunction = async ({ request, context }) => {
  const authenticator = getAuthenticator(context)
  const user = await authenticator.isAuthenticated(request)

  if (!user) {
    console.log("↪️: User not logged in, sent to /auth/login")

    return redirect("/auth/login")
  }

  if (!user.isVerified) {
    console.log(`↪️: User ${user.email} not verified, sent to /app/settings`)

    return redirect("/app/settings")
  }

  console.log(`↪️: User ${user.email} logged in, sent to /auth/logged-in`)
  return redirect("/auth/logged-in")
}
