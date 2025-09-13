/**
 * Standardized API response utility functions
 */

export const successResponse = (res, message, data = null, statusCode = 200, meta = {}) => {
    const response = {
        success: true,
        message,
        timestamp: new Date().toISOString(),
        ...meta
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

export const errorResponse = (res, message, statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString()
    };

    if (errors) {
        response.errors = errors;
    }

    if (process.env.NODE_ENV === 'development' && errors?.stack) {
        response.stack = errors.stack;
    }

    return res.status(statusCode).json(response);
};

export const paginatedResponse = (res, message, data, pagination, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        pagination: {
            page: parseInt(pagination.page),
            limit: parseInt(pagination.limit),
            total: pagination.total,
            totalPages: Math.ceil(pagination.total / pagination.limit),
            hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
            hasPrevPage: pagination.page > 1
        },
        timestamp: new Date().toISOString()
    });
};

export const validationErrorResponse = (res, errors) => {
    return errorResponse(res, "Validation failed", 400, {
        validation: Array.isArray(errors) ? errors : [errors]
    });
};

export const notFoundResponse = (res, resource = "Resource") => {
    return errorResponse(res, `${resource} not found`, 404);
};

export const unauthorizedResponse = (res, message = "Unauthorized access") => {
    return errorResponse(res, message, 401);
};

export const forbiddenResponse = (res, message = "Forbidden access") => {
    return errorResponse(res, message, 403);
};

export const conflictResponse = (res, message = "Resource conflict") => {
    return errorResponse(res, message, 409);
};

export const internalServerErrorResponse = (res, error = null) => {
    console.error("Internal server error:", error);
    return errorResponse(res, "Internal server error", 500, error);
};