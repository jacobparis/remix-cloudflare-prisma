import {
  LoaderFunction,
  json,
  Form,
  Link,
  useLoaderData,
  redirect,
  MetaFunction,
} from "remix"

import { getAuthenticator } from "~/auth.server"

export const meta: MetaFunction = () => {
  return {
    title: "Logged in",
  }
}

export const loader: LoaderFunction = async ({ request, context }) => {
  const authenticator = getAuthenticator(context)

  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/triage",
  })

  return json({
    user,
  })
}

export default function Login() {
  const { user } = useLoaderData()

  return (
    <>
      <div className="flex flex-col justify-center min-h-full py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 style={{filter: 'drop-shadow(0.125rem 0.25rem 0px #e11d48)'}} className="text-6xl font-extrabold text-center mb-6  text-gray-900 relative"> LOGO </h1>

          <h2 className="mb-6 text-3xl font-extrabold text-center text-gray-500">
            Welcome back!
          </h2>
        </div>

        <div className="px-4 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Link
            to="/app"
            className="flex justify-center w-full px-4 py-2 mb-4 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          >
            {user.name ? `Continue as ${user.name}` : "Continue"}
          </Link>
          <Form method="post" action="/auth/signout" reloadDocument>
            <div>
              <button
                type="submit"
                className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Not you? &nbsp; <u> Switch accounts </u>
              </button>
            </div>
          </Form>
        </div>
      </div>
    </>
  )
}
