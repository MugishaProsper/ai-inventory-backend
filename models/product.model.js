import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    description: { type: String },
    price: { type: Number, required: [true, "Product price required!"] },
    cost: { type: Number, required: true },
    quantity: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 10, min: 0 },
    maxStock: { type: Number, default: 1000, min: 0 },
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Category",
        required: true 
    },
    supplier: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Supplier",
        required: true 
    },
    location: { type: String, default: "Warehouse A" },
    images: [{ type: String }],
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'discontinued'], 
        default: 'active' 
    },
    tags: [{ type: String }],
    statistics: {
        totalSold: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        avgRating: { type: Number, default: 0, min: 0, max: 5 },
        totalRatingCount: { type: Number, default: 0 },
        totalRating: { type: Number, default: 0 },
        viewCount: { type: Number, default: 0 }
    },
    aiInsights: {
        demandForecast: {
            nextMonth: { type: Number, default: 0 },
            confidence: { type: Number, default: 0, min: 0, max: 1 },
            trend: { type: String, enum: ['increasing', 'decreasing', 'stable'], default: 'stable' }
        },
        reorderSuggestion: {
            suggested: { type: Boolean, default: false },
            quantity: { type: Number, default: 0 },
            urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
        }
    }
}, { timestamps: true });

// Indexes for better performance
productSchema.index({ user: 1, sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ 'aiInsights.reorderSuggestion.suggested': 1 });

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
    if (this.quantity === 0) return 'out_of_stock';
    if (this.quantity <= this.minStock) return 'low_stock';
    if (this.quantity >= this.maxStock) return 'overstock';
    return 'in_stock';
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
    if (this.cost === 0) return 0;
    return ((this.price - this.cost) / this.cost * 100);
});

// Method to rate product
productSchema.methods.rateProduct = async function (rating) {
    try {
        this.statistics.totalRating += rating;
        this.statistics.totalRatingCount += 1;
        this.statistics.avgRating = (this.statistics.totalRating / this.statistics.totalRatingCount);
        await this.save();
    } catch (error) {
        throw new Error(error);
    }    
};

// Method to update stock
productSchema.methods.updateStock = async function (quantity, operation = 'add') {
    try {
        if (operation === 'add') {
            this.quantity += quantity;
        } else if (operation === 'subtract') {
            this.quantity = Math.max(0, this.quantity - quantity);
            this.statistics.totalSold += quantity;
            this.statistics.totalRevenue += (this.price * quantity);
        } else if (operation === 'set') {
            this.quantity = quantity;
        }
        await this.save();
    } catch (error) {
        throw new Error(error);
    }
};

// Method to check if reorder is needed
productSchema.methods.needsReorder = function() {
    return this.quantity <= this.minStock && this.status === 'active';
};

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', async function(next) {
    if (!this.sku) {
        const count = await this.constructor.countDocuments();
        this.sku = `SKU-${Date.now()}-${count + 1}`;
    }
    next();
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model("Product", productSchema);
export default Product;