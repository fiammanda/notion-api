![Notion API Worker](https://user-images.githubusercontent.com/1440854/79893752-cc448680-8404-11ea-8d19-e0308eb32028.png)

A serverless wrapper for the private Notion API by **[splitbee](https://github.com/splitbee/notion-api-worker)**. 

Provides fast and easy access to your Notion content. Ideal to make Notion your CMS.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Ffiammanda%2Fnotion-api)

## Scripts

- Install: `bun install`
- Typecheck: `bun tsc`
- Develop: `wrangler dev`
- Deploy: `wrangler deploy`

## Endpoints

- Load page: `/page/<ID>`
- Load database: `/list/<ID>`
