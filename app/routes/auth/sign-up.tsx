import {
  ActionFunction,
  LoaderFunction,
  Form,
  useLoaderData,
  redirect,
  Link,
  useActionData,
  MetaFunction,
} from "remix"
import invariant from "tiny-invariant"

import normalizeEmail from "validator/es/lib/normalizeEmail"
import * as pbkdf2 from "~/pbkdf2.server"

import { AlertRed } from "~/AlertRed"
import { getAuthenticator } from "~/auth.server"

export const meta: MetaFunction = () => {
  return {
    title: "Create Account",
  }
}

export const action: ActionFunction = async ({ request, context }) => {
  const { prismaWrite, prismaRead } = context
  // This is just like the login function, except we clone the request
  // And use their info to create a user before we attempt to authenticate
  const form = await request.clone().formData()

  const emailInput = form.get("email")
  invariant(emailInput, "Email is required")

  const passwordInput = form.get("password")
  invariant(passwordInput, "Password is required")

  const hash = await pbkdf2.hash({
    password: passwordInput.toString(),
    pepper: context.authPepper,
  })

  // Effectively identical email addresses should map to the same accounts
  // eg: user@gmail.com and USER@gmail.COM should be the same user
  const normalizedEmail = normalizeEmail(emailInput.toString())
  invariant(normalizedEmail)

  const dbUser = await prismaRead.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  })

  if (dbUser) {
    return {
      errors: {
        userExists: true,
      },
    }
  }

  await prismaWrite.user.create({
    data: {
      email: normalizedEmail,
      name: "",
      password: hash,
    },
  })

  const authenticator = getAuthenticator(context)

  await authenticator.authenticate("login", request, {
    successRedirect: "/triage",
    failureRedirect: `/auth/login?email=${normalizedEmail}`,
  })
}

export const loader: LoaderFunction = async ({ request, context }) => {
  // If the user is already authenticated redirect to /dashboard directly
  const authenticator = getAuthenticator(context)

  const user = await authenticator.isAuthenticated(request)
  if (user) {
    // Logged in users do not belong here, let triage handle them
    return redirect("/triage")
  }

  const session = await context.sessionStorage.getSession(
    request.headers.get("Cookie")
  )

  const errors = {
    server: session.data["__flash_auth:error__"],
  }

  return {
    errors,
  }
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

export default function Login() {
  const { errors } = useLoaderData()

  const anyError = Boolean(errors.server)

  return (
    <>
      <div className="flex flex-col justify-center min-h-full py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="px-4 py-8 bg-white drop-shadow sm:rounded-lg sm:px-10">
            <div className=" sm:mx-auto sm:w-full sm:max-w-md">
              <h1 style={{filter: 'drop-shadow(0.125rem 0.25rem 0px #e11d48)'}} className="text-6xl font-extrabold text-center mb-6  text-gray-900 relative"> LOGO </h1>
              
              <h2 className="mb-6 text-3xl font-extrabold text-center text-gray-500">
                Create a new account
              </h2>
            </div>
            <Form className="space-y-6" method="post" reloadDocument>
              {anyError ? (
                <AlertRed>We were unable to create your account</AlertRed>
              ) : null}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={classNames(
                      "block w-full pr-10 rounded-md sm:text-sm focus:outline-none",
                      "placeholder-gray-400 border border-gray-300 shadow-sm appearance-none focus:ring-rose-500 focus:border-rose-500"
                    )}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="password"
                    className={classNames(
                      "block w-full pr-10 rounded-md sm:text-sm focus:outline-none",
                      "placeholder-gray-400 border border-gray-300 shadow-sm appearance-none focus:ring-rose-500 focus:border-rose-500"
                    )}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  Create account
                </button>
              </div>
            </Form>
            <div className="mt-2 text-center">
              <Link
                to="/auth/login"
                className="font-medium text-rose-600 hover:text-rose-500"
              >
                {" "}
                Already have an account? &nbsp; <u className="">Log in</u>{" "}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
