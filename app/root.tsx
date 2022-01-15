import {
  Links,
  LinksFunction,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from "remix";
import type { MetaFunction } from "remix";

import tailwindcss from "./tailwind.css"
if (!tailwindcss) {
  throw new Error(process.env.NODE_ENV === 'production' ? "CSS file not found." : `Tailwind "CSS file not found." Please run "npm run build:tailwind"`)
}

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwindcss },
  ]
}

export const meta: MetaFunction = () => {
  return { title: "Remix Cloudflare Prisma" };
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}
