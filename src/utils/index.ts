import { HandlerRequest } from "../api/types.js";

export const getNotionToken = (c: HandlerRequest) => {
  return (
    c.env.NOTION_TOKEN ||
    (c.req.header("Authorization") || "").split("Bearer ")[1] ||
    undefined
  );
};
