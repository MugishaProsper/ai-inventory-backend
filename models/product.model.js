import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    user : { type : mongoose.Schema.Types.ObjectId, ref : "User", required : true },
    name : { type : String, required : true },
    price : { type : String, required : [true, "Product price required!"] },
    images : [{ type : String }],
    categories : [{ type : String }]
}, { timestamps : true });

productSchema.methods.rateProduct = async function (rating) {
    try {
        this.statistics.total_rating += rating;
        this.statistics.total_rating_count += 1;
        this.statistics.avg_rating = (this.statistics.total_rating/this.statistics.total_rating_count)
    } catch (error) {
        throw new Error(error)
    }    
}

const Product = mongoose.model("products", productSchema);
export default Product