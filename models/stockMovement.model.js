import mongoose from "mongoose";

const stockMovementSchema = mongoose.Schema({
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product", 
        required: true 
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['in', 'out', 'adjustment', 'transfer', 'damaged', 'returned'],
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true 
    },
    previousQuantity: { 
        type: Number, 
        required: true 
    },
    newQuantity: { 
        type: Number, 
        required: true 
    },
    unitCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    reason: { type: String },
    reference: { 
        type: String,  // Order ID, Transfer ID, etc.
    },
    location: {
        from: { type: String },
        to: { type: String }
    },
    supplier: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Supplier" 
    },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    notes: { type: String },
    attachments: [{ 
        name: { type: String },
        url: { type: String } 
    }],
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'cancelled'],
        default: 'completed' 
    }
}, { timestamps: true });

// Indexes
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ user: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1 });
stockMovementSchema.index({ reference: 1 });
stockMovementSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate total cost
stockMovementSchema.pre('save', function(next) {
    this.totalCost = this.quantity * this.unitCost;
    next();
});

// Static method to get stock movements for a product
stockMovementSchema.statics.getProductHistory = async function(productId, limit = 50) {
    return this.find({ product: productId })
        .populate('user', 'name email')
        .populate('supplier', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Static method to get movements by date range
stockMovementSchema.statics.getMovementsByDateRange = async function(startDate, endDate, filters = {}) {
    const query = {
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        },
        ...filters
    };
    
    return this.find(query)
        .populate('product', 'name sku')
        .populate('user', 'name')
        .populate('supplier', 'name')
        .sort({ createdAt: -1 });
};

// Static method to get stock movement analytics
stockMovementSchema.statics.getAnalytics = async function(userId, period = '30d') {
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const pipeline = [
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                totalQuantity: { $sum: '$quantity' },
                totalValue: { $sum: '$totalCost' }
            }
        }
    ];
    
    return this.aggregate(pipeline);
};

const StockMovement = mongoose.model("StockMovement", stockMovementSchema);
export default StockMovement;