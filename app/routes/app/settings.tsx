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
import parseFormData from "@ssttevee/cfw-formdata-polyfill/ponyfill"
import { ImageInput } from "~/ImageInput"

export const meta: MetaFunction = () => {
  return {
    title: "Settings",
  }
}

const uploadHandler = async (
  file: Blob,
  {
    cloudflareAccountId,
    cloudflareImagesToken,
  }: { cloudflareAccountId: string; cloudflareImagesToken: string }
) => {
  const body = new FormData()
  body.append(
    "file",
    new Blob([await file.arrayBuffer()], { type: "image/png" }),
    "file.png"
  )

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/images/v1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cloudflareImagesToken}`,
      },
      body,
    }
  )

  const string = await response.text()

  if (string.includes("ERROR")) {
    // ERROR 9422: Decode error: image failed to be decoded: Uploaded image must have image/jpeg or image/png content type
    console.error(string)

    return undefined
  }

  const { result } = JSON.parse(string)

  return result.variants[0]
}

export const action: ActionFunction = async ({ request, context }) => {
  const form = await parseFormData.call(request)

  const authenticator = getAuthenticator(context)

  const user = await authenticator.isAuthenticated(request)
  invariant(user, "Not authorized")

  const {
    prismaWrite,
    prismaRead,
    cloudflareAccountId,
    cloudflareImagesToken,
  } = context

  const dbUser = await prismaRead.user.findUnique({
    where: {
      email: user.email,
    },
    select: {
      id: true,
      name: true,
      isVerified: true,
    },
  })

  const nameInput = form.get("name")
  const shouldUpdateName = nameInput && dbUser.name !== nameInput.toString()
  let nameData = {} as { name?: string }
  if (shouldUpdateName) {
    nameData = {
      name: nameInput.toString(),
    }
  }

  const avatar = form.get("avatar") as Blob
  let avatarData = {}
  if (avatar) {
    const avatarUrl = await uploadHandler(avatar, {
      cloudflareAccountId,
      cloudflareImagesToken,
    })

    avatarData = {
      files: {
        createMany: {
          data: [
            {
              url: avatarUrl,
              type: "AVATAR",
            },
          ],
        },
      },
    }
  }

  if (!shouldUpdateName && !avatar) {
    // Nothing actually changed, let's bail
    return json({
      success: true,
    })
  }

  await prismaWrite.user.update({
    where: {
      email: user.email,
    },
    data: {
      ...nameData,
      ...avatarData,
      isVerified: true,
    },
  })

  // Some of the user information gets stored in the session for immediate access
  // If any of that is updated, we want to also update the session
  // Otherwise the user would have to log out and back in to refresh it
  const sessionInformationChanged = !dbUser.isVerified || shouldUpdateName

  if (sessionInformationChanged) {
    const { commitSession, getSession } = context.sessionStorage
    const session = await getSession(request.headers.get("Cookie"))

    const sessionUser = session.get("user")
    session.set("user", {
      ...sessionUser,
      name: nameData.name,
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

  const { prismaRead } = context

  const dbUser = await prismaRead.user.findUnique({
    where: {
      email: user.email,
    },
    select: {
      name: true,
      isVerified: true,
      files: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  return {
    user: {
      name: dbUser.name,
      isVerified: dbUser.isVerified,
      avatarUrl: dbUser.files[0]?.url,
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
          {!user.isVerified ? (
            <AlertBlue className="mb-4">
              In order to verify your identity, we need you to enter some
              information
            </AlertBlue>
          ) : submission.success ? (
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
                        className="block w-48 border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="max-w-xs">
                    <ImageInput
                      label="Avatar"
                      name="avatar"
                      id="avatar"
                      defaultImage={user.avatarUrl}
                    />
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
