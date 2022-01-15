import { Authenticator } from "remix-auth"
import invariant from "tiny-invariant"
import type { User } from "@prisma/client"
import { FormStrategy } from "remix-auth-form"
import type { AppLoadContext } from "remix"

import * as pbkdf2 from "~/pbkdf2.server"

export function getAuthenticator({
  sessionStorage,
  authPepper,
  prismaRead,
  prismaWrite,
}: AppLoadContext) {
  const authenticator = new Authenticator(sessionStorage) as Authenticator<User>

  authenticator
    .use(
      new FormStrategy(async ({ form }) => {
        // Email
        const emailInput = form.get("email")
        invariant(emailInput)
        const email = emailInput.toString()

        invariant(typeof email === "string", "email must be a string")
        invariant(email.length > 0, "username must not be empty")

        // TODO: Check emails against a validation API 
        if (email.includes("#")) {
          throw new Error("EMAIL_INCORRECT")
        }

        // Password
        const passwordInput = form.get("password")
        invariant(passwordInput)
        const password = passwordInput.toString()

        invariant(typeof password === "string", "password must be a string")
        invariant(password.length > 0, "password must not be empty")

        // fetch user from DB and get their encoded password
        const dbUser = await prismaRead.user.findUnique({
          where: {
            email: email,
          },
        })

        if (!dbUser) {
          throw new Error("LOGIN_USER_NOT_FOUND")
        }

        const isValid = await pbkdf2.verify({
          password: passwordInput.toString(),
          pepper: authPepper,
          hash: dbUser.password,
        })

        if (!isValid) {
          throw new Error("LOGIN_PASSWORD_INCORRECT")
        } else {
          console.log("Authentication for", email, "successful…")
        }

        const user: User = {
          id: dbUser.id,
          email: dbUser.email,
        }

        console.log("Login", user)

        return user
      }),
      "login"
    )

  return authenticator
}
