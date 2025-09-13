import mongoose from "mongoose";

const aiInsightSchema = mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    type: { 
        type: String, 
        enum: [
            'demand_forecast', 
            'reorder_suggestion', 
            'trend_analysis', 
            'anomaly_detection',
            'price_optimization',
            'supplier_performance',
            'inventory_optimization'
        ],
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    confidence: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 1 
    },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium' 
    },
    status: { 
        type: String, 
        enum: ['active', 'dismissed', 'implemented', 'expired'],
        default: 'active' 
    },
    actionable: { 
        type: Boolean, 
        default: true 
    },
    products: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product" 
    }],
    categories: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Category" 
    }],
    suppliers: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Supplier" 
    }],
    data: {
        // Flexible data structure for different insight types
        forecast: {
            period: { type: String }, // '30d', '60d', '90d'
            predictions: [{
                date: { type: Date },
                value: { type: Number },
                confidence: { type: Number }
            }]
        },
        reorderSuggestion: {
            suggestedQuantity: { type: Number },
            estimatedStockoutDate: { type: Date },
            leadTime: { type: Number }, // in days
            seasonalFactor: { type: Number }
        },
        trendAnalysis: {
            trend: { type: String, enum: ['increasing', 'decreasing', 'stable', 'seasonal'] },
            changePercent: { type: Number },
            period: { type: String },
            seasonalPattern: { type: Boolean }
        },
        anomaly: {
            detectedValue: { type: Number },
            expectedValue: { type: Number },
            deviation: { type: Number },
            anomalyType: { type: String } // 'spike', 'drop', 'unusual_pattern'
        },
        priceOptimization: {
            currentPrice: { type: Number },
            suggestedPrice: { type: Number },
            expectedImpact: {
                revenueChange: { type: Number },
                demandChange: { type: Number }
            }
        }
    },
    metrics: {
        accuracy: { type: Number }, // For tracking prediction accuracy
        impact: { type: Number }, // Business impact score
        implementationCost: { type: Number }
    },
    expiresAt: { 
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    implementedAt: { type: Date },
    dismissedAt: { type: Date },
    dismissedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    },
    feedback: {
        helpful: { type: Boolean },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String }
    }
}, { timestamps: true });

// Indexes
aiInsightSchema.index({ user: 1, type: 1 });
aiInsightSchema.index({ status: 1, priority: 1 });
aiInsightSchema.index({ expiresAt: 1 });
aiInsightSchema.index({ createdAt: -1 });
aiInsightSchema.index({ confidence: -1 });

// Virtual for age in days
aiInsightSchema.virtual('ageInDays').get(function() {
    return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for time until expiry
aiInsightSchema.virtual('timeUntilExpiry').get(function() {
    const now = new Date();
    const expiry = this.expiresAt;
    return Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
});

// Method to dismiss insight
aiInsightSchema.methods.dismiss = async function(userId, reason) {
    this.status = 'dismissed';
    this.dismissedAt = new Date();
    this.dismissedBy = userId;
    if (reason) {
        this.feedback.comment = reason;
    }
    await this.save();
};

// Method to mark as implemented
aiInsightSchema.methods.implement = async function() {
    this.status = 'implemented';
    this.implementedAt = new Date();
    await this.save();
};

// Static method to get insights by priority
aiInsightSchema.statics.getByPriority = async function(userId, priority, limit = 10) {
    return this.find({ 
        user: userId, 
        priority: priority, 
        status: 'active',
        expiresAt: { $gt: new Date() }
    })
    .populate('products', 'name sku')
    .populate('categories', 'name')
    .populate('suppliers', 'name')
    .sort({ confidence: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get actionable insights
aiInsightSchema.statics.getActionable = async function(userId, limit = 20) {
    return this.find({ 
        user: userId, 
        actionable: true, 
        status: 'active',
        expiresAt: { $gt: new Date() }
    })
    .populate('products', 'name sku quantity minStock')
    .populate('categories', 'name')
    .populate('suppliers', 'name')
    .sort({ priority: 1, confidence: -1 })
    .limit(limit);
};

// Static method to clean up expired insights
aiInsightSchema.statics.cleanupExpired = async function() {
    return this.updateMany(
        { 
            expiresAt: { $lt: new Date() },
            status: 'active'
        },
        { 
            status: 'expired' 
        }
    );
};

aiInsightSchema.set('toJSON', { virtuals: true });
aiInsightSchema.set('toObject', { virtuals: true });

const AIInsight = mongoose.model("AIInsight", aiInsightSchema);
export default AIInsight;