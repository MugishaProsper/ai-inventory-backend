import Joi from "joi";

// Generic validation middleware
export const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property]);
        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: errorMessage
            });
        }
        next();
    };
};

// Product validation schemas
export const productSchemas = {
    create: Joi.object({
        name: Joi.string().required().min(2).max(255),
        sku: Joi.string().optional().max(100),
        description: Joi.string().optional().max(1000),
        price: Joi.number().required().min(0),
        cost: Joi.number().required().min(0),
        quantity: Joi.number().integer().min(0).default(0),
        minStock: Joi.number().integer().min(0).default(10),
        maxStock: Joi.number().integer().min(1).default(1000),
        category: Joi.string().required(),
        supplier: Joi.string().required(),
        location: Joi.string().optional().max(255),
        images: Joi.array().items(Joi.string().uri()).optional(),
        tags: Joi.array().items(Joi.string().max(50)).optional()
    }),
    
    update: Joi.object({
        name: Joi.string().optional().min(2).max(255),
        sku: Joi.string().optional().max(100),
        description: Joi.string().optional().max(1000),
        price: Joi.number().optional().min(0),
        cost: Joi.number().optional().min(0),
        quantity: Joi.number().integer().min(0).optional(),
        minStock: Joi.number().integer().min(0).optional(),
        maxStock: Joi.number().integer().min(1).optional(),
        category: Joi.string().optional(),
        supplier: Joi.string().optional(),
        location: Joi.string().optional().max(255),
        images: Joi.array().items(Joi.string().uri()).optional(),
        tags: Joi.array().items(Joi.string().max(50)).optional(),
        status: Joi.string().valid('active', 'inactive', 'discontinued').optional()
    }),

    stockUpdate: Joi.object({
        quantity: Joi.number().integer().min(0).required(),
        operation: Joi.string().valid('add', 'subtract', 'set').default('set'),
        reason: Joi.string().optional().max(255),
        reference: Joi.string().optional().max(255)
    })
};

// Category validation schemas
export const categorySchemas = {
    create: Joi.object({
        name: Joi.string().required().min(2).max(255),
        description: Joi.string().optional().max(500),
        color: Joi.string().optional().max(50),
        icon: Joi.string().optional().max(50),
        parentCategory: Joi.string().optional(),
        sortOrder: Joi.number().integer().min(0).optional()
    }),
    
    update: Joi.object({
        name: Joi.string().optional().min(2).max(255),
        description: Joi.string().optional().max(500),
        color: Joi.string().optional().max(50),
        icon: Joi.string().optional().max(50),
        parentCategory: Joi.string().optional(),
        sortOrder: Joi.number().integer().min(0).optional(),
        isActive: Joi.boolean().optional()
    })
};

// Supplier validation schemas
export const supplierSchemas = {
    create: Joi.object({
        name: Joi.string().required().min(2).max(255),
        code: Joi.string().optional().max(50),
        contact: Joi.object({
            email: Joi.string().email().optional(),
            phone: Joi.string().optional().max(20),
            website: Joi.string().uri().optional(),
            contactPerson: Joi.string().optional().max(255)
        }).optional(),
        address: Joi.object({
            street: Joi.string().optional().max(255),
            city: Joi.string().optional().max(100),
            state: Joi.string().optional().max(100),
            zipCode: Joi.string().optional().max(20),
            country: Joi.string().optional().max(100)
        }).optional(),
        paymentTerms: Joi.object({
            creditDays: Joi.number().integer().min(0).default(30),
            discountPercent: Joi.number().min(0).max(100).default(0),
            preferredPaymentMethod: Joi.string().valid('cash', 'check', 'bank_transfer', 'credit_card').default('bank_transfer')
        }).optional(),
        tags: Joi.array().items(Joi.string().max(50)).optional(),
        notes: Joi.string().optional().max(1000)
    }),
    
    update: Joi.object({
        name: Joi.string().optional().min(2).max(255),
        code: Joi.string().optional().max(50),
        contact: Joi.object({
            email: Joi.string().email().optional(),
            phone: Joi.string().optional().max(20),
            website: Joi.string().uri().optional(),
            contactPerson: Joi.string().optional().max(255)
        }).optional(),
        address: Joi.object({
            street: Joi.string().optional().max(255),
            city: Joi.string().optional().max(100),
            state: Joi.string().optional().max(100),
            zipCode: Joi.string().optional().max(20),
            country: Joi.string().optional().max(100)
        }).optional(),
        paymentTerms: Joi.object({
            creditDays: Joi.number().integer().min(0).optional(),
            discountPercent: Joi.number().min(0).max(100).optional(),
            preferredPaymentMethod: Joi.string().valid('cash', 'check', 'bank_transfer', 'credit_card').optional()
        }).optional(),
        status: Joi.string().valid('active', 'inactive', 'blacklisted').optional(),
        tags: Joi.array().items(Joi.string().max(50)).optional(),
        notes: Joi.string().optional().max(1000)
    }),

    rating: Joi.object({
        rating: Joi.number().min(1).max(5).required(),
        comment: Joi.string().optional().max(500)
    })
};

// Inventory validation schemas
export const inventorySchemas = {
    addProduct: Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        location: Joi.string().optional().max(50),
        reason: Joi.string().optional().max(255)
    }),
    
    removeProduct: Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        reason: Joi.string().optional().max(255)
    }),
    
    reserveProduct: Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        reason: Joi.string().optional().max(255)
    }),
    
    transfer: Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        fromLocation: Joi.string().required().max(50),
        toLocation: Joi.string().required().max(50),
        reason: Joi.string().optional().max(255)
    }),
    
    updateSettings: Joi.object({
        name: Joi.string().optional().min(2).max(255),
        description: Joi.string().optional().max(500),
        location: Joi.string().optional().max(255),
        type: Joi.string().valid('main', 'backup', 'retail', 'warehouse').optional(),
        settings: Joi.object({
            autoReorder: Joi.boolean().optional(),
            lowStockThreshold: Joi.number().integer().min(0).optional(),
            trackExpiry: Joi.boolean().optional(),
            allowNegativeStock: Joi.boolean().optional()
        }).optional()
    })
};

// AI validation schemas
export const aiSchemas = {
    forecast: Joi.object({
        productIds: Joi.array().items(Joi.string()).optional(),
        period: Joi.string().valid('7d', '14d', '30d', '60d', '90d').default('30d')
    }),
    
    reorderSuggestions: Joi.object({
        threshold: Joi.alternatives().try(
            Joi.string().valid('auto'),
            Joi.number().integer().min(0)
        ).default('auto')
    }),
    
    anomalies: Joi.object({
        sensitivity: Joi.string().valid('low', 'medium', 'high').default('medium')
    }),
    
    dismissInsight: Joi.object({
        reason: Joi.string().optional().max(500)
    })
};

// Query parameter validation schemas
export const querySchemas = {
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
    }),
    
    productFilters: Joi.object({
        search: Joi.string().optional().max(255),
        category: Joi.string().optional(),
        supplier: Joi.string().optional(),
        status: Joi.string().valid('active', 'inactive', 'discontinued').optional(),
        stockStatus: Joi.string().valid('in_stock', 'low_stock', 'out_of_stock', 'overstock').optional(),
        minPrice: Joi.number().min(0).optional(),
        maxPrice: Joi.number().min(0).optional(),
        tags: Joi.string().optional(),
        sortBy: Joi.string().valid('name', 'price', 'quantity', 'createdAt', 'updatedAt').default('name'),
        sortOrder: Joi.string().valid('asc', 'desc').default('asc')
    }).concat(Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
    }))
};