import {
  Link,
  LoaderFunction,
  MetaFunction,
  redirect,
  useLoaderData,
} from "remix"
import invariant from "tiny-invariant"

import { getAuthenticator } from "~/auth.server"
export const loader: LoaderFunction = async ({ request, context }) => {
  const authenticator = getAuthenticator(context)

  const user = await authenticator.isAuthenticated(request)
  invariant(user, "Not authorized")

  if (!user.isVerified) {
    return redirect("/triage")
  }

  const [dbFile] = await context.prismaRead.file.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
    },
  })

  console.log({ user })

  return {
    user,
    avatarUrl: dbFile && dbFile.url,
  }
}

export const meta: MetaFunction = () => {
  return {
    title: "Dashboard",
  }
}

export default function Index() {
  const { user, avatarUrl } = useLoaderData()

  return (
    <>
      <div className="max-w-3xl px-4 mx-auto mb-8 sm:px-6 md:px-8">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          Welcome, {user.name}!
        </h1>

        {avatarUrl ? (
          <div className="mb-8">
            <img src={avatarUrl} />
          </div>
        ) : null}

        <footer className="flex flex-col space-y-4">
          <Link
            to="/app/settings"
            className="text-rose-600 hover:text-rose-500"
          >
            Update profile information
          </Link>

          <form method="post" action="/auth/sign-out">
            <button
              type="submit"
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Log out
            </button>
          </form>
        </footer>
      </div>
    </>
  )
}
