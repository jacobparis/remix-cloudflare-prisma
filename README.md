# Welcome to Remix!

- [Remix Docs](https://remix.run/docs)

## Development

You will be utlizing Wrangler for local development to emulate the Cloudflare runtime. This is already wired up in your package.json as the `dev` script:

```sh
$ npm run dev
```

Open up [http://localhost:8788](http://localhost:8788) and you should be ready to go!

## MongoDB Atlas

There are many hosts for your database you can use, and Prisma is not limited to only MongoDB. For this project, I used MongoDB Atlas.

All of the available clusters are compatible – from the sandbox, to the serverless, to the M10 and onward.

While creating your cluster, Atlas will prompt you to set a username and password. Save this information in your password manager

## Prisma

Prisma advertises the Data Proxy as a solution to allow serverless environments to communicate with conventional databases, providing a proxy that optimizes the connection strategy.

You may think that you don't need to worry about the data proxy if you're using Prisma with a serverless database, but that's not the case. In order to generate a Cloudflare compatible Prisma Client, you must set up and enable the Data Proxy.

Note that the build script (and the dev script in `pm2.config.js`) sets the environment variable `PRISMA_CLIENT_ENGINE_TYPE=dataproxy` before generating the Prisma schema. This is the key, in combination with adding the `dataProxy` preview feature in the schema, that will allow Prisma to run in a Cloudflare environment.

Create a Prisma Cloud account, if you don't already have one, that connects to your database using the MongoDB connection string you saved, and to your repository using a Github/GitLab integration. This integration will allow it to pull your schema directly from the `prisma/schema.prisma` folder.

Prisma will generate its own connection string for you. Save that to your password manager, and set it as the DATABASE_URL environment variable in your application.

## Cloudflare Pages

Cloudflare Pages is a managed static web host and features automatic deploys from your Git repository, similar to offerings provided by Netlify or Vercel. While the latter two use AWS Lambda for their serverless functions, Cloudflare uses Cloudflare workers, which are similar but run on V8 instead of Node.

Running on V8 is one part of a puzzle that allows Workers to execute dynamic code as fast as serving static files from the CDN, but the tradeoff is that Node native packages are not supported. Some can be polyfilled, and are in this project, while others cannot, like `async_hooks` and `_http_common`, which is the reason for the Prisma data proxy requirement. If you get an error about these two packages, ensure again you've set the `PRISMA_CLIENT_ENGINE_TYPE=dataproxy` before generating the Prisma client.

Cloudflare Pages are currently only deployable through their Git provider integrations.

If you don't already have an account, then [create a Cloudflare account here](https://dash.cloudflare.com/sign-up/pages) and after verifying your email address with Cloudflare, go to your dashboard and follow the [Cloudflare Pages deployment guide](https://developers.cloudflare.com/pages/framework-guides/deploy-anything).

The "Build command" should be set to `npm run build`, and the "Build output directory" should be set to `public`.

A misconfigured output directory will cause a cryptic "internal error occurred" during deployment, so make sure it's set correctly.

In your Page Settings, add the environment for this project. That will be the DATABASE_URL for now, and the CLOUDFLARE_IMAGES_TOKEN and CLOUDFLARE_ACCOUNT_ID in the next step.

## Cloudflare Images

Cloudflare Images is Cloudflare's hosted image hosting service.

Create a token at [Get an API key](https://dash.cloudflare.com/profile/api-tokens) and give it permissions for `Account.Cloudflare Images`. Save this key in your password manager, and add it to your environment variables as `CLOUDFLARE_IMAGES_TOKEN`.

Under `Developer Resources` on the left side of the page, you'll see your 32 digit Account Id. You can also find it in the URL of your Cloudflare Dashboard. Save this in your password manager and add it to your environment variables as `CLOUDFLARE_ACCOUNT_ID`
