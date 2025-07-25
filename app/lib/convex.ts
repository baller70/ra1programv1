import { ConvexReactClient } from "convex/react";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// HTTP client for server-side operations (like webhooks)
const convexHttp = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export { convex, convexHttp }; 