import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getContracts = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    templateType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { page = 1, limit = 50, status, templateType } = args;

    // For now, return mock contract data since contracts aren't in the schema yet
    // This would be replaced with actual contract queries when contracts are added to the schema
    const mockContracts = [
      {
        _id: "mock-contract-1" as any,
        parentId: "parent-1",
        parentName: "John Doe",
        parentEmail: "john@example.com",
        fileName: "contract_2024_001.pdf",
        originalName: "Basketball Program Contract 2024",
        fileUrl: "/contracts/contract_2024_001.pdf",
        status: "signed",
        templateType: "yearly-program",
        uploadedAt: Date.now() - 86400000, // 1 day ago
        signedAt: Date.now() - 43200000, // 12 hours ago
        expiresAt: Date.now() + 31536000000, // 1 year from now
        notes: "Contract signed and active"
      },
      {
        _id: "mock-contract-2" as any,
        parentId: "parent-2", 
        parentName: "Jane Smith",
        parentEmail: "jane@example.com",
        fileName: "contract_2024_002.pdf",
        originalName: "Basketball Program Contract 2024",
        fileUrl: "/contracts/contract_2024_002.pdf",
        status: "pending",
        templateType: "seasonal-program",
        uploadedAt: Date.now() - 172800000, // 2 days ago
        signedAt: undefined,
        expiresAt: Date.now() + 2592000000, // 30 days from now
        notes: "Awaiting parent signature"
      }
    ];

    // Filter by status if provided
    let filteredContracts = mockContracts;
    if (status && status !== 'all') {
      filteredContracts = mockContracts.filter(contract => contract.status === status);
    }

    // Filter by template type if provided
    if (templateType && templateType !== 'all') {
      filteredContracts = filteredContracts.filter(contract => contract.templateType === templateType);
    }

    const offset = (page - 1) * limit;
    const paginatedContracts = filteredContracts.slice(offset, offset + limit);

    return {
      contracts: paginatedContracts,
      pagination: {
        page,
        limit,
        total: filteredContracts.length,
        pages: Math.ceil(filteredContracts.length / limit),
      },
    };
  },
});

export const getContract = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // Mock single contract data
    return {
      _id: args.id,
      parentId: "parent-1",
      parentName: "John Doe",
      parentEmail: "john@example.com",
      fileName: "contract_2024_001.pdf",
      originalName: "Basketball Program Contract 2024",
      fileUrl: "/contracts/contract_2024_001.pdf",
      status: "signed",
      templateType: "yearly-program",
      uploadedAt: Date.now() - 86400000,
      signedAt: Date.now() - 43200000,
      expiresAt: Date.now() + 31536000000,
      notes: "Contract signed and active"
    };
  },
});

export const updateContract = mutation({
  args: {
    id: v.string(),
    status: v.optional(v.string()),
    templateType: v.optional(v.string()),
    notes: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Mock update - in real implementation this would update the contract
    console.log("Updating contract:", args);
    return { success: true, id: args.id };
  },
});

export const deleteContract = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // Mock delete - in real implementation this would delete the contract
    console.log("Deleting contract:", args.id);
    return { success: true };
  },
}); 