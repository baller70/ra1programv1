import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getTeams = query({
  args: {
    includeParents: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const teams = await ctx.db.query("teams").collect();
    
    if (args.includeParents) {
      const teamsWithParents = await Promise.all(
        teams.map(async (team) => {
          const parents = await ctx.db.query("parents").collect();
          return {
            ...team,
            parents: parents.slice(0, 5),
          };
        })
      );
      return teamsWithParents;
    }
    
    return teams;
  },
});

export const getTeam = query({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createTeam = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      color: args.color,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });

    return teamId;
  },
});
