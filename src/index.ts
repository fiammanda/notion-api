import {} from "@cloudflare/workers-types";
import { Router, Method } from "tiny-request-router";

import { pageRoute } from "./routes/page";
import { tableRoute } from "./routes/table";
import { userRoute } from "./routes/user";
import { searchRoute } from "./routes/search";
import { createResponse } from "./response";
import { getCacheKey } from "./get-cache-key";
import * as types from "./api/types";

export type Handler = (
  req: types.HandlerRequest
) => Promise<Response> | Response;

function getCorsHeaders(request: Request) {
  const origin = request.headers.get("Origin");
  const url = new URL(request.url);
  if (KEY && url.searchParams.has(KEY)) {
    return {};
  } else if (ORIGIN_ALLOW.split(", ").includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    };
  } else {
    return null;
  }
}

const router = new Router<Handler>();

router.options("*", (request) => {
  const headers = getCorsHeaders(request);
  if (headers) {
    return new Response(null, { headers });
  } else {
    return new Response(`{"error":"Forbidden"}`, {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      }
    });
  }
});
router.get("/page/:pageId", pageRoute);
router.get("/table/:pageId", tableRoute);
//router.get("/user/:userId", userRoute);
//router.get("/search", searchRoute);

router.get("*", async () =>
  createResponse({
    error: `Route not found`,
    routes: ["/page/:pageId", "/table/:pageId"],
  }, {}, 404)
);

const cache = (caches as any).default;
const NOTION_API_TOKEN =
  typeof NOTION_TOKEN !== "undefined" ? NOTION_TOKEN : undefined;

const handleRequest = async (fetchEvent: FetchEvent): Promise<Response> => {
  const request = fetchEvent.request;
  const headers = getCorsHeaders(request);
  if (!headers) {
    return new Response(`{"error":"Forbidden"}`, {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      }
    });
  }

  const { pathname, searchParams } = new URL(request.url);
  const notionToken =
    NOTION_API_TOKEN ||
    (request.headers.get("Authorization") || "").split("Bearer ")[1] ||
    undefined;

  const match = router.match(request.method as Method, pathname);

  if (!match) {
    return new Response("Endpoint not found.", { status: 404 });
  }

  const cacheKey = getCacheKey(request);
  let response;

  if (cacheKey) {
    try {
      response = await cache.match(cacheKey);
    } catch (err) {}
  }

  const getResponseAndPersist = async () => {
    const res = await match.handler({
      request,
      searchParams,
      params: match.params,
      notionToken,
    });

    if (cacheKey) {
      await cache.put(cacheKey, res.clone());
    }

    return res;
  };

  if (response) {
    fetchEvent.waitUntil(getResponseAndPersist());
    return response;
  }

  return getResponseAndPersist();
};

self.addEventListener("fetch", async (event: Event) => {
  const fetchEvent = event as FetchEvent;
  fetchEvent.respondWith(handleRequest(fetchEvent));
});
