export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "*";
  const allowedOrigin = Deno.env.get("SITE_URL") || "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin === "*" ? origin : allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}
