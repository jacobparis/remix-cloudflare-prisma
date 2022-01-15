import { Link, LoaderFunction, MetaFunction, useLoaderData } from "remix"
import invariant from "tiny-invariant"

import { getAuthenticator } from "~/auth.server"
export const loader: LoaderFunction = async ({ request, context }) => {
  const authenticator = getAuthenticator(context)

  const user = await authenticator.isAuthenticated(request)
  invariant(user, "Not authorized")

  return {
    user,
  }
}

export const meta: MetaFunction = () => {
  return {
    title: "Dashboard",
  }
}

export default function Index() {
  const { user } = useLoaderData()

  return (
    <>
      <div className="max-w-3xl px-4 mx-auto mb-8 sm:px-6 md:px-8">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          Welcome, {user.name}!
        </h1>

        <footer>
          <Link
            to="/app/settings"
            className="text-rose-600 hover:text-rose-500"
          >
            Update profile information
          </Link>
        </footer>
      </div>
    </>
  )
}
