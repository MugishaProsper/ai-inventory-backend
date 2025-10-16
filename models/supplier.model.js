import mongoose from "mongoose";

const supplierSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        unique: true,
        sparse: true
    },
    contact: {
        email: {
            type: String,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        phone: { type: String },
        website: { type: String },
        contactPerson: { type: String }
    },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String }
    },
    paymentTerms: {
        creditDays: { type: Number, default: 30 },
        discountPercent: { type: Number, default: 0 },
        preferredPaymentMethod: {
            type: String,
            enum: ['cash', 'check', 'bank_transfer', 'credit_card'],
            default: 'bank_transfer'
        }
    },
    performance: {
        rating: { type: Number, default: 0, min: 0, max: 5 },
        totalOrders: { type: Number, default: 0 },
        onTimeDeliveries: { type: Number, default: 0 },
        qualityScore: { type: Number, default: 0, min: 0, max: 100 },
        responseTime: { type: Number, default: 0 } // in hours
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'blacklisted'],
        default: 'active'
    },
    tags: [{ type: String }],
    notes: { type: String },
    documents: [{
        name: { type: String },
        url: { type: String },
        type: {
            type: String,
            enum: ['contract', 'certificate', 'tax_document', 'other']
        },
        uploadDate: { type: Date, default: Date.now }
    }],
    logo: { type: String }
}, { timestamps: true });

// Indexes
supplierSchema.index({ name: 1 });
supplierSchema.index({ code: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ 'contact.email': 1 });

// Virtual for delivery performance percentage
supplierSchema.virtual('deliveryPerformance').get(function () {
    if (this.performance.totalOrders === 0) return 0;
    return (this.performance.onTimeDeliveries / this.performance.totalOrders * 100);
});

// Virtual for overall score
supplierSchema.virtual('overallScore').get(function () {
    const deliveryScore = this.deliveryPerformance;
    const qualityScore = this.performance.qualityScore;
    const ratingScore = (this.performance.rating / 5) * 100;

    return (deliveryScore * 0.4 + qualityScore * 0.4 + ratingScore * 0.2);
});

// Method to update performance
supplierSchema.methods.updatePerformance = async function (orderData) {
    try {
        this.performance.totalOrders += 1;

        if (orderData.onTime) {
            this.performance.onTimeDeliveries += 1;
        }

        if (orderData.qualityRating) {
            const currentTotal = this.performance.qualityScore * (this.performance.totalOrders - 1);
            this.performance.qualityScore = (currentTotal + orderData.qualityRating) / this.performance.totalOrders;
        }

        if (orderData.responseTime) {
            const currentTotal = this.performance.responseTime * (this.performance.totalOrders - 1);
            this.performance.responseTime = (currentTotal + orderData.responseTime) / this.performance.totalOrders;
        }

        await this.save();
    } catch (error) {
        throw new Error(error);
    }
};

// Pre-save middleware to generate code if not provided
supplierSchema.pre('save', async function (next) {
    if (!this.code && this.isNew) {
        const count = await this.constructor.countDocuments();
        this.code = `SUP-${Date.now().toString().slice(-6)}-${(count + 1).toString().padStart(3, '0')}`;
    }
    next();
});

supplierSchema.set('toJSON', { virtuals: true });
supplierSchema.set('toObject', { virtuals: true });

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;