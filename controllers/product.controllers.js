import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        if (!products || products.length <= 0) return res.status(404).json({ message: "No products found" });
        return res.status(200).json({ message: "Products found", products: products })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
};
export const getMyProducts = async (req, res) => {
    const { id } = req.user;
    try {
        const products = await Product.find({ user: id });
        if (!products || products.length <= 0) return res.status(404).json({ message: "Products not found" });
        return res.status(200).json({ message: "Your products found", products: products })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const createProduct = async (req, res) => {
    const { id } = req.user;
    const { name, price, categories } = req.body;
    try {
        const product = new Product({
            name: name, user: id, price: price, categories: categories
        });
        await product.save();
        return res.status(201).json({ message: "Product created" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
};

export const deleteProduct = async (req, res) => {
    const { id } = req.user;
    const { productId } = req.params;
    try {
        const product = await Product.findOneAndDelete({ _id: productId, user: id });
        if (!product) return res.status(404).json({ message: "Product not found" });
        return res.status(200).json({ message: "Product deleted" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
};




/** Finesse functions */

export const likeProduct = async (req, res) => {
    const { id } = req.user
    const { productId } = req.params;
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });
        const existingLiker = product.likers.find(liker =>
            liker.user.toString() == id
        )
        if (existingLiker) return res.status(403).json({ message: "Already liked this product" })
        product.likes += 1;
        product.likers.push({ user : id });
        await product.save()
        return res.status(200).json({ message: "Liked product", likes: product.likes })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
};

export const unlikeProject = async (req, res) => {
    const { productId } = req.params;
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });
        product.likes -= 1;
        await product.save();
        return res.status(200).json({ message: "Product unliked", likes: product.likes });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const rateProduct = async (req, res) => {
    const { productId } = req.params;
    const { rating } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });
        product.statistics.ratings_count += 1;
        // function defined in model
        await product.rateProduct(rating);
        await product.save()
        return res.status(200).json({ message: "Liked product", avg_rating: product.statistics.avg_rating })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}