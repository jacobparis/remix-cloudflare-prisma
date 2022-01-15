import { Outlet } from "react-router"
import { LoaderFunction, redirect, } from "remix"
import { getAuthenticator } from "~/auth.server"

export const loader: LoaderFunction = async ({ request, context }) => {
  const authenticator = getAuthenticator(context)
  const user = await authenticator.isAuthenticated(request)

  // This will guard all routes in /app so that only logged in users can see them
  if (!user) {
    return redirect('/triage')
  }

  return {
    user,
  }
}

export default function AppLayout() {
  return (
    <div className="min-h-[80vh]">
      <main className="flex-1">
        <div className="py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
