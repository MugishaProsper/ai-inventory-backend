import mongoose from "mongoose";

/**
 * Database utility functions
 */

// Check if a document exists by ID
export const documentExists = async (Model, id, userId = null) => {
    try {
        const query = { _id: id };
        if (userId) query.user = userId;
        
        const document = await Model.findOne(query);
        return !!document;
    } catch (error) {
        return false;
    }
};

// Get document by ID with user check
export const getDocumentById = async (Model, id, userId = null, populate = []) => {
    try {
        const query = { _id: id };
        if (userId) query.user = userId;
        
        let queryBuilder = Model.findOne(query);
        
        if (populate.length > 0) {
            populate.forEach(pop => {
                queryBuilder = queryBuilder.populate(pop);
            });
        }
        
        return await queryBuilder;
    } catch (error) {
        return null;
    }
};

// Check if ObjectId is valid
export const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Convert string to ObjectId safely
export const toObjectId = (id) => {
    if (!isValidObjectId(id)) {
        throw new Error(`Invalid ObjectId: ${id}`);
    }
    return new mongoose.Types.ObjectId(id);
};

// Build pagination query
export const buildPaginationQuery = (page = 1, limit = 20) => {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    
    return {
        skip: (pageNum - 1) * limitNum,
        limit: limitNum,
        page: pageNum
    };
};

// Build sort query
export const buildSortQuery = (sortBy = 'createdAt', sortOrder = 'desc') => {
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    return sortOptions;
};

// Build search query for text fields
export const buildSearchQuery = (searchTerm, fields = []) => {
    if (!searchTerm || fields.length === 0) return {};
    
    return {
        $or: fields.map(field => ({
            [field]: { $regex: searchTerm, $options: 'i' }
        }))
    };
};

// Build date range query
export const buildDateRangeQuery = (startDate, endDate, field = 'createdAt') => {
    const query = {};
    
    if (startDate || endDate) {
        query[field] = {};
        if (startDate) query[field].$gte = new Date(startDate);
        if (endDate) query[field].$lte = new Date(endDate);
    }
    
    return query;
};

// Aggregate with pagination
export const aggregateWithPagination = async (Model, pipeline, page = 1, limit = 20) => {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    
    // Add pagination stages to pipeline
    const paginatedPipeline = [
        ...pipeline,
        {
            $facet: {
                data: [
                    { $skip: (pageNum - 1) * limitNum },
                    { $limit: limitNum }
                ],
                count: [
                    { $count: "total" }
                ]
            }
        }
    ];
    
    const result = await Model.aggregate(paginatedPipeline);
    const data = result[0]?.data || [];
    const total = result[0]?.count[0]?.total || 0;
    
    return {
        data,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    };
};

// Batch operations helper
export const batchOperation = async (Model, operations, batchSize = 100) => {
    const results = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const batchResult = await Promise.allSettled(
            batch.map(operation => operation())
        );
        results.push(...batchResult);
    }
    
    return results;
};

// Transaction helper
export const withTransaction = async (callback) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// Clean up expired documents
export const cleanupExpiredDocuments = async (Model, expiryField = 'expiresAt') => {
    try {
        const result = await Model.deleteMany({
            [expiryField]: { $lt: new Date() }
        });
        return result.deletedCount;
    } catch (error) {
        console.error(`Error cleaning up expired documents:`, error);
        return 0;
    }
};

// Bulk upsert helper
export const bulkUpsert = async (Model, documents, upsertField = '_id') => {
    const bulkOps = documents.map(doc => ({
        updateOne: {
            filter: { [upsertField]: doc[upsertField] },
            update: { $set: doc },
            upsert: true
        }
    }));
    
    return await Model.bulkWrite(bulkOps);
};