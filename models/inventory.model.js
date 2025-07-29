import mongoose from "mongoose";

const inventorySchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name : { type : String },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        unitPrice: { type: Number, default: 0.0 },
        quantity: { type: Number, default: 0 }
    }],
    value: { type: Number, default: 0.0 }
}, { timestamps: true });

inventorySchema.pre("save", async function(){
    try {
        let total = 0;
        this.products.forEach(product => {
            total += product.unitPrice * product.quantity;    
        });
        this.value = total;
    } catch (error) {
        throw new Error(error)
    }
})

const Inventory = mongoose.model("inventories", inventorySchema);
export default Inventory