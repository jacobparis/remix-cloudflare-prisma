![image](https://user-images.githubusercontent.com/5633704/149652098-2fb61ce1-aea5-4cea-b4bb-a6d2888d129b.png)

# Remix Cloudflare Prisma Example

Developed by [Jacob Paris](https://www.jacobparis.com/)

- [Remix Docs](https://remix.run/docs)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [Prisma Docs](https://www.prisma.io/docs/getting-started)

If you have any questions, feel free to [hit me up on Twitter](https://twitter.com/intent/follow?screen_name=jacobmparis)

## Demo

Check out the [demo](https://remix-cloudflare-prisma.pages.dev/)

- Hosted on Cloudflare Pages
- Custom authentication using [Remix Auth](https://github.com/sergiodxa/remix-auth) and [Remix Auth Form](https://github.com/sergiodxa/remix-auth-form)
- Prisma ORM connected to a MongoDB Atlas Database
- A file upload form that sends to Cloudflare Images
- Password hashing with PBKDF2

### Settings page
![image](https://user-images.githubusercontent.com/5633704/149652076-f6f89e65-7af1-4cbe-8ea4-38a5e7b34aa8.png)

### Home page
![image](https://user-images.githubusercontent.com/5633704/149652614-f251cdb0-26f5-42c8-9e66-735989c1b777.png)


## Development

I use `pm2` to orchestrate the development tooling. You can use pm2 to run start all the development services at once.

```sh
npm run dev
```

### Prisma

Prisma is the database client that allows us to interact with the database. . When you run the generate command, Prisma will compile the schema into TypeScript.

PM2 is set up to re-generate the prisma client whenever the schema is modified.

```sh
PRISMA_CLIENT_ENGINE_TYPE=dataproxy prisma generate
```

### Tailwind

Tailwind is a CSS library that scans your application for specific utility classes and generates minimalist stylesheets for only the classes you use.

The `content` property in `tailwind.config.js` determines which files Tailwind will watch, and it will recompile whenever any of those change.

```sh
tailwindcss -o ./app/tailwind.css --watch
```

### Remix

Remix is an extension to React Router that runs on both client and server, allowing request endpoints to be created at each route and client routes to be rendered serverside.

Remix will rebuild whenever any files in its `./app` directory are updated.

```sh
remix watch
```

### Server

The server is a Cloudflare worker that gets compiled to a `_worker.js` file in the `./public` directory. The native Cloudflare Pages way to create the worker is to use a `functions/[[path]].js` file, but that method does not allow us to modify the build process. Prisma will not work without adding some esbuild plugins, which means we need to compile our worker ourselves.

PM2 will recompile the worker every time Remix rebuilds.

```sh
node build-server.mjs
```

### Wrangler

Wrangler is a command line tool for simulating a Cloudflare Pages environment locally.

```sh
npx wrangler pages dev ./public
```

Wrangler will open up on [http://localhost:8788](http://localhost:8788) and serve your application from its built files.

## Setup

You'll need to set up some external services

### MongoDB Atlas

There are many hosts for your database you can use, and Prisma is not limited to only MongoDB. For this project, I used MongoDB Atlas.

All of the available clusters are compatible – from the sandbox, to the serverless, to the M10 and onward.

While creating your cluster, Atlas will prompt you to set a username and password. Save this information in your password manager

### Prisma

Prisma advertises the Data Proxy as a solution to allow serverless environments to communicate with conventional databases, providing a proxy that optimizes the connection strategy.

You may think that you don't need to worry about the data proxy if you're using Prisma with a serverless database, but that's not the case. In order to generate a Cloudflare compatible Prisma Client, you must set up and enable the Data Proxy.

Note that the build script (and the dev script in `pm2.config.js`) sets the environment variable `PRISMA_CLIENT_ENGINE_TYPE=dataproxy` before generating the Prisma schema. This is the key, in combination with adding the `dataProxy` preview feature in the schema, that will allow Prisma to run in a Cloudflare environment.

Create a Prisma Cloud account, if you don't already have one, that connects to your database using the MongoDB connection string you saved, and to your repository using a Github/GitLab integration. This integration will allow it to pull your schema directly from the `prisma/schema.prisma` folder.

Prisma will generate its own connection string for you. Save that to your password manager, and set it as the DATABASE_URL environment variable in your application.

### Cloudflare Pages

Cloudflare Pages is a managed static web host and features automatic deploys from your Git repository, similar to offerings provided by Netlify or Vercel. While the latter two use AWS Lambda for their serverless functions, Cloudflare uses Cloudflare workers, which are similar but run on V8 instead of Node.

Running on V8 is one part of a puzzle that allows Workers to execute dynamic code as fast as serving static files from the CDN, but the tradeoff is that Node native packages are not supported. Some can be polyfilled, and are in this project, while others cannot, like `async_hooks` and `_http_common`, which is the reason for the Prisma data proxy requirement. If you get an error about these two packages, ensure again you've set the `PRISMA_CLIENT_ENGINE_TYPE=dataproxy` before generating the Prisma client.

Cloudflare Pages are currently only deployable through their Git provider integrations.

If you don't already have an account, then [create a Cloudflare account here](https://dash.cloudflare.com/sign-up/pages) and after verifying your email address with Cloudflare, go to your dashboard and follow the [Cloudflare Pages deployment guide](https://developers.cloudflare.com/pages/framework-guides/deploy-anything).

The "Build command" should be set to `npm run build`, and the "Build output directory" should be set to `public`.

A misconfigured output directory will cause a cryptic "internal error occurred" during deployment, so make sure it's set correctly.

In your Page Settings, add the environment for this project. That will be the DATABASE_URL for now, and the CLOUDFLARE_IMAGES_TOKEN and CLOUDFLARE_ACCOUNT_ID in the next step.

### Cloudflare Images

Cloudflare Images is Cloudflare's hosted image hosting service.

Create a token at [Get an API key](https://dash.cloudflare.com/profile/api-tokens) and give it permissions for `Account.Cloudflare Images`. Save this key in your password manager, and add it to your environment variables as `CLOUDFLARE_IMAGES_TOKEN`.

Under `Developer Resources` on the left side of the page, you'll see your 32 digit Account Id. You can also find it in the URL of your Cloudflare Dashboard. Save this in your password manager and add it to your environment variables as `CLOUDFLARE_ACCOUNT_ID`

## Common Errors

Here are some issues I ran into while building Cloudflare applications with Remix

### Deployment

When `npm install` runs in `NODE_ENV=production`, only the regular dependencies are installed. Any command line tools that are required to build and deploy should not be in devDependencies.

The Remix starter puts `@remix-run/dev` in dev dependencies, and this will need to be moved.

### Process is not defined

The entirety of `process.env.NODE_ENV` is a Node idea, from using a variable named node environment to determine whether you are in production or not, to the process object it's contained in.

Cloudflare Workers and Pages run on V8, which does not have this. However, your build script runs in Node, so you can pass them into the build function using esbuild's define feature.

Check the `build-server.mjs` function and make sure you're defining each environment variable there.

### Could not resolve "https", "zlib", "fs"

Other node packages that Remix uses must be polyfilled to work on Cloudflare.

If you get an error that says something like `Could not resolve "https" (use "platform: 'node'" when building for node)`, make sure you're importing the `esbuild-plugins-node-modules-polyfill` plugin in your `build-server.mjs`

```js
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill"

esbuild.build({
  plugins: [nodeModulesPolyfillPlugin()],
})
```

### Prisma Client cannot run in the browser

The Prisma Client contains code meant to run on the server, but the heuristic it uses to determine if it's running on the server involves reading if it's in a Node environment.

Like many of the issues we face with Cloudflare, this one is also rooted in the fact we're using a non-node javascript server.

The solution is to resolve the path to the Prisma Client from a Node environment, so that we get the right client (and not the browser honeypot that throws errors at us), and then alias all requests to specifically that path.

Resolving the path with require.resolve(path) would work out of the box if we were in an environment that supported Node's module format, CommonJS. But we're not, so we may get any number of errors like this:

```
require is not defined
cannot read property resolve of undefined
require.resolve is not a function
```

Check the `build-server.mjs` and make sure you're using the `esbuild-plugin-alias` package to resolve the Prisma Client

```js
import alias from "esbuild-plugin-alias"


import NodeModule from "module"
const { createRequire } = NodeModule
const require = createRequire(import.meta.url)


esbuild.build({
  …
  plugins: [
    alias({
      "@prisma/client": require.resolve("@prisma/client"),
    }),
  ],
})
```

### Async I/O error

Cloudflare has security policies that forbid certain types of processing from occurring outside of the context of a network request.

Loading the Prisma client is one of these issues, which is why we need to call `getClient` from `worker/index.ts` inside the `getLoadContext` function.

### Error 1101

Requests are limited to 50ms of CPU time and a small amount of RAM usage. Going over these limits has undefined behaviour – sometimes it will let certain requests pass but it does stop them after a threshold.

If you get Worker Error 1101 when trying to do a thing, it's likely that you're going over one of these limits. Look for intensive operations and see if removing them will solve the issue.

Many hash functions work by using intentionally computationally complex algorithms. It doesn't bother a user to wait 100ms to hash their password, but an attacker trying millions of passwords will be held at bay for extensive lengths of time.

Argon2 and BCrypt are two such algorithms, and both will quickly exhaust Cloudflare's precious allotted milliseconds, throwing Error 1101

The best we can do within a worker is a PBKDF2 implementation with few enough iterations that it doesn't exceed the limit
