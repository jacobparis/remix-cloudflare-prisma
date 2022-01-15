import { Link, LoaderFunction, MetaFunction, useLoaderData } from "remix"
// import { prismaRead } from "~/prisma.server"
import invariant from "tiny-invariant"
import type { Card } from "@prisma/client"

import { getAuthenticator } from "~/auth.server"
export const loader: LoaderFunction = async ({ request, context }) => {
  const authenticator = getAuthenticator(context)

  const user = await authenticator.isAuthenticated(request)
  invariant(user, "Not authorized")

  return {
    user,
  }
}

type LoaderType = {
  cards: Card[]
  numberOfCards: number
}

export const meta: MetaFunction = () => {
  return {
    title: "Dashboard",
  }
}

export default function Index() {
  const { cards, numberOfCards } = useLoaderData<LoaderType>()

  return (
    <>
      <div className="max-w-3xl px-4 mx-auto mb-8 sm:px-6 md:px-8">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">User</h1>


      </div>
    </>
  )
}
