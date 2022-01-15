import invariant from "tiny-invariant"
import {
  ActionFunction,
  json,
  Link,
  LoaderFunction,
  MetaFunction,
  useActionData,
  useLoaderData,
} from "remix"

import { getAuthenticator } from "~/auth.server"
import { AlertGreen } from "~/AlertGreen"
import { AlertBlue } from "~/AlertBlue"

export const meta: MetaFunction = () => {
  return {
    title: "Settings",
  }
}

export const action: ActionFunction = async ({ request, context }) => {
  const form = await request.formData()

  const authenticator = getAuthenticator(context)

  const user = await authenticator.isAuthenticated(request)
  invariant(user, "Not authorized")

  const nameInput = form.get("name")
  invariant(nameInput, "Name is required")
  const name = nameInput.toString()

  const { prismaWrite, prismaRead } = context

  const dbUser = await prismaRead.user.findUnique({
    where: {
      email: user.email,
    },
    select: {
      name: true,
    },
  })

  if (dbUser.name !== name) {
    await prismaWrite.user.update({
      where: {
        email: user.email,
      },
      data: {
        name: nameInput.toString(),
        isVerified: true,
      },
    })

    const { commitSession, getSession } = context.sessionStorage
    const session = await getSession(request.headers.get("Cookie"))

    const sessionUser = session.get("user")
    session.set("user", {
      ...sessionUser,
      name: nameInput.toString(),
      isVerified: true,
    })

    return json(
      {
        success: true,
      },
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      }
    )
  }

  return json({
    success: true,
  })
}

export const loader: LoaderFunction = async ({ request, context }) => {
  const authenticator = getAuthenticator(context)

  const user = await authenticator.isAuthenticated(request)
  invariant(user, "Not authorized")

  const { prismaWrite } = context

  const dbUser = await prismaWrite.user.findUnique({
    where: {
      email: user.email,
    },
  })

  return {
    user: {
      name: dbUser.name,
      isVerified: dbUser.isVerified,
    },
  }
}
export default function Settings() {
  const { user } = useLoaderData()
  const submission = useActionData() || {}

  return (
    <>
      <div className="max-w-3xl px-4 mx-auto mb-8 sm:px-6 md:px-8">
        <div>
          {submission.success ? (
            <AlertGreen className="mb-4">
              <p>Success</p>
              <p className="mt-2 text-sm text-green-700">
                Your profile has been updated
              </p>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    to="/app"
                    className="bg-green-50 px-2 py-1.5 rounded-md text-sm font-bold text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                  >
                    Go to dashboard
                  </Link>
                </div>
              </div>
            </AlertGreen>
          ) : !user.isVerified ? (
            <AlertBlue className="mb-4">
              In order to verify your identity, we need you to enter some
              information
            </AlertBlue>
          ) : null}

          <form
            encType="multipart/form-data"
            method="post"
            className="space-y-8 "
          >
            <div className="space-y-8 ">
              <div>
                <div>
                  <h1 className="text-lg font-medium leading-6 text-gray-900">
                    Profile
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    This information will not be displayed publicly
                  </p>
                </div>

                <div className="grid grid-cols-1 mt-6 gap-y-6 gap-x-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        defaultValue={user.name || ""}
                        required
                        className="block w-48 border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5">
              <div className="flex">
                <button
                  type="submit"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  Update profile
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
