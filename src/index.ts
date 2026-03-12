import { Hono } from "hono"
import { listRoute } from "./routes/list.js"
import { pageRoute } from "./routes/page.js"

type Bindings = {
  KEY: string
  ORIGIN_ALLOW: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get("/favicon.ico", (c) => new Response(null))

app.use("*", async (c, next) => {
  const url = new URL(c.req.url)
  const origin = c.req.header("Origin")
  const allows = c.env.ORIGIN_ALLOW.split(", ")
  const permit = url.searchParams.has(c.env.KEY) ||
    origin && (allows.includes(origin) || origin.endsWith(allows[0]))
  if (!permit) {
    c.status(403)
    return c.json({"error": "forbidden"})
  }
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": origin ? origin! : "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS"
      }
    })
  }
  await next()
  c.res.headers.set("Access-Control-Allow-Origin", origin ? origin! : "*")
  c.res.headers.set("Access-Control-Allow-Headers", "*")
  c.res.headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
})

app.get("/list/:id", listRoute)
app.get("/page/:id", pageRoute)

export default app