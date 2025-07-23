/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as contracts from "../contracts.js";
import type * as dashboard from "../dashboard.js";
import type * as messageLogs from "../messageLogs.js";
import type * as migrations from "../migrations.js";
import type * as parents from "../parents.js";
import type * as paymentPlans from "../paymentPlans.js";
import type * as payments from "../payments.js";
import type * as teams from "../teams.js";
import type * as templates from "../templates.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  contracts: typeof contracts;
  dashboard: typeof dashboard;
  messageLogs: typeof messageLogs;
  migrations: typeof migrations;
  parents: typeof parents;
  paymentPlans: typeof paymentPlans;
  payments: typeof payments;
  teams: typeof teams;
  templates: typeof templates;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
