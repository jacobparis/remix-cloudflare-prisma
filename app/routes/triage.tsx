/**
 * This triage route looks up a user and sends them where they need to be
 */

import { LoaderFunction, redirect } from "remix";
import { getAuthenticator } from "~/auth.server";

export const loader: LoaderFunction = async ({ request, context }) => {
  const authenticator = getAuthenticator(context)
  const user = await authenticator.isAuthenticated(request)

  if (!user) {
    return redirect('/auth/login')
  }

  if (!user.isVerified) {
    return redirect("/app/settings")
  }

  return redirect('/auth/logged-in')
}
