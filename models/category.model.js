import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    description: { type: String },
    color: { 
        type: String, 
        default: 'bg-blue-500',
        match: /^(bg-|#)/  // Supports Tailwind classes or hex colors
    },
    icon: { type: String, default: 'Package' }, // Lucide icon name
    parentCategory: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Category" 
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    metadata: {
        productCount: { type: Number, default: 0 },
        totalValue: { type: Number, default: 0 },
        avgPrice: { type: Number, default: 0 }
    }
}, { timestamps: true });

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parentCategory'
});

// Method to update metadata
categorySchema.methods.updateMetadata = async function() {
    try {
        const Product = mongoose.model('Product');
        const products = await Product.find({ category: this._id });
        
        this.metadata.productCount = products.length;
        this.metadata.totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
        this.metadata.avgPrice = products.length > 0 ? 
            products.reduce((sum, product) => sum + product.price, 0) / products.length : 0;
        
        await this.save();
    } catch (error) {
        throw new Error(error);
    }
};

// Pre-remove middleware to handle cascading
categorySchema.pre('remove', async function() {
    try {
        // Move products to 'Uncategorized' category or handle as needed
        const Product = mongoose.model('Product');
        await Product.updateMany(
            { category: this._id },
            { $unset: { category: 1 } }
        );
    } catch (error) {
        throw new Error(error);
    }
});

categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

const Category = mongoose.model("Category", categorySchema);
export default Category;