import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMessagesByParent = query({
  args: { parentId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messageLogs")
      .filter((q) => q.eq(q.field("parentId"), args.parentId))
      .order("desc")
      .take(50);

    return {
      messages: messages.map(msg => ({
        id: msg._id,
        content: msg.content || msg.body || '',
        channel: msg.channel || 'email',
        sentAt: msg.sentAt ? new Date(msg.sentAt).toISOString() : new Date().toISOString(),
        status: msg.status || 'sent',
        subject: msg.subject || ''
      }))
    };
  },
});

export const createMessage = mutation({
  args: {
    parentId: v.string(),
    content: v.string(),
    channel: v.string(),
    subject: v.optional(v.string()),
    templateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messageLogs", {
      parentId: args.parentId,
      content: args.content,
      body: args.content,
      channel: args.channel,
      subject: args.subject || '',
      templateId: args.templateId,
      status: 'sent',
      sentAt: Date.now(),
      type: 'manual'
    });

    return { success: true, id: messageId };
  },
}); 