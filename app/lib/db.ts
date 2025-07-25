import { ConvexHttpClient } from "convex/browser";

// Convex client configuration
export const convexHttp = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Database abstraction layer - now using only Convex
export const db = {
  // Helper to get the Convex client
  getConvexClient: () => convexHttp,
};
