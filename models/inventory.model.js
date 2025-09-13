import mongoose from "mongoose";

const inventorySchema = mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    name: { 
        type: String, 
        required: true,
        default: "Main Inventory"
    },
    description: { type: String },
    location: { 
        type: String, 
        default: "Primary Warehouse" 
    },
    type: { 
        type: String, 
        enum: ['main', 'backup', 'retail', 'warehouse'],
        default: 'main' 
    },
    products: [{
        product: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Product",
            required: true 
        },
        quantity: { 
            type: Number, 
            default: 0,
            min: 0 
        },
        reservedQuantity: { 
            type: Number, 
            default: 0,
            min: 0 
        },
        availableQuantity: { 
            type: Number, 
            default: 0,
            min: 0 
        },
        lastRestockDate: { type: Date },
        lastSaleDate: { type: Date },
        location: { 
            type: String, 
            default: "A1" // Shelf/bin location
        },
        notes: { type: String }
    }],
    statistics: {
        totalProducts: { type: Number, default: 0 },
        totalValue: { type: Number, default: 0 },
        totalCost: { type: Number, default: 0 },
        lowStockItems: { type: Number, default: 0 },
        outOfStockItems: { type: Number, default: 0 },
        overstockItems: { type: Number, default: 0 }
    },
    settings: {
        autoReorder: { type: Boolean, default: false },
        lowStockThreshold: { type: Number, default: 10 },
        trackExpiry: { type: Boolean, default: false },
        allowNegativeStock: { type: Boolean, default: false }
    },
    alerts: [{
        type: { 
            type: String, 
            enum: ['low_stock', 'out_of_stock', 'overstock', 'expiry', 'reorder'] 
        },
        product: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Product" 
        },
        message: { type: String },
        severity: { 
            type: String, 
            enum: ['info', 'warning', 'error', 'critical'],
            default: 'info' 
        },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
inventorySchema.index({ user: 1 });
inventorySchema.index({ 'products.product': 1 });
inventorySchema.index({ type: 1 });
inventorySchema.index({ isActive: 1 });

// Virtual for total unique products
inventorySchema.virtual('uniqueProductCount').get(function() {
    return this.products.length;
});

// Virtual for products needing reorder
inventorySchema.virtual('productsNeedingReorder').get(function() {
    return this.products.filter(item => {
        // This would need to be populated to access product.minStock
        return item.quantity <= (item.product?.minStock || 0);
    }).length;
});

// Method to add product to inventory
inventorySchema.methods.addProduct = async function(productId, quantity, location = "A1") {
    try {
        const existingProduct = this.products.find(p => 
            p.product.toString() === productId.toString()
        );
        
        if (existingProduct) {
            existingProduct.quantity += quantity;
            existingProduct.availableQuantity = existingProduct.quantity - existingProduct.reservedQuantity;
            existingProduct.lastRestockDate = new Date();
        } else {
            this.products.push({
                product: productId,
                quantity: quantity,
                availableQuantity: quantity,
                location: location,
                lastRestockDate: new Date()
            });
        }
        
        await this.updateStatistics();
        await this.save();
    } catch (error) {
        throw new Error(error);
    }
};

// Method to remove product from inventory
inventorySchema.methods.removeProduct = async function(productId, quantity) {
    try {
        const productIndex = this.products.findIndex(p => 
            p.product.toString() === productId.toString()
        );
        
        if (productIndex === -1) {
            throw new Error('Product not found in inventory');
        }
        
        const inventoryProduct = this.products[productIndex];
        
        if (inventoryProduct.availableQuantity < quantity) {
            throw new Error('Insufficient available quantity');
        }
        
        inventoryProduct.quantity -= quantity;
        inventoryProduct.availableQuantity = inventoryProduct.quantity - inventoryProduct.reservedQuantity;
        inventoryProduct.lastSaleDate = new Date();
        
        if (inventoryProduct.quantity <= 0) {
            this.products.splice(productIndex, 1);
        }
        
        await this.updateStatistics();
        await this.save();
    } catch (error) {
        throw new Error(error);
    }
};

// Method to reserve product quantity
inventorySchema.methods.reserveProduct = async function(productId, quantity) {
    try {
        const inventoryProduct = this.products.find(p => 
            p.product.toString() === productId.toString()
        );
        
        if (!inventoryProduct) {
            throw new Error('Product not found in inventory');
        }
        
        if (inventoryProduct.availableQuantity < quantity) {
            throw new Error('Insufficient available quantity for reservation');
        }
        
        inventoryProduct.reservedQuantity += quantity;
        inventoryProduct.availableQuantity = inventoryProduct.quantity - inventoryProduct.reservedQuantity;
        
        await this.save();
    } catch (error) {
        throw new Error(error);
    }
};

// Method to update statistics
inventorySchema.methods.updateStatistics = async function() {
    try {
        await this.populate('products.product');
        
        let totalValue = 0;
        let totalCost = 0;
        let lowStockItems = 0;
        let outOfStockItems = 0;
        let overstockItems = 0;
        
        this.products.forEach(item => {
            if (item.product) {
                totalValue += item.product.price * item.quantity;
                totalCost += item.product.cost * item.quantity;
                
                if (item.quantity === 0) {
                    outOfStockItems++;
                } else if (item.quantity <= item.product.minStock) {
                    lowStockItems++;
                } else if (item.quantity >= item.product.maxStock) {
                    overstockItems++;
                }
            }
        });
        
        this.statistics.totalProducts = this.products.length;
        this.statistics.totalValue = totalValue;
        this.statistics.totalCost = totalCost;
        this.statistics.lowStockItems = lowStockItems;
        this.statistics.outOfStockItems = outOfStockItems;
        this.statistics.overstockItems = overstockItems;
    } catch (error) {
        throw new Error(error);
    }
};

// Method to generate alerts
inventorySchema.methods.generateAlerts = async function() {
    try {
        await this.populate('products.product');
        
        // Clear existing alerts
        this.alerts = [];
        
        this.products.forEach(item => {
            if (item.product) {
                if (item.quantity === 0) {
                    this.alerts.push({
                        type: 'out_of_stock',
                        product: item.product._id,
                        message: `${item.product.name} is out of stock`,
                        severity: 'critical'
                    });
                } else if (item.quantity <= item.product.minStock) {
                    this.alerts.push({
                        type: 'low_stock',
                        product: item.product._id,
                        message: `${item.product.name} is running low (${item.quantity} remaining)`,
                        severity: 'warning'
                    });
                } else if (item.quantity >= item.product.maxStock) {
                    this.alerts.push({
                        type: 'overstock',
                        product: item.product._id,
                        message: `${item.product.name} is overstocked (${item.quantity} units)`,
                        severity: 'info'
                    });
                }
            }
        });
        
        await this.save();
    } catch (error) {
        throw new Error(error);
    }
};

// Pre-save middleware to update statistics
inventorySchema.pre("save", async function() {
    if (this.isModified('products')) {
        await this.updateStatistics();
    }
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;