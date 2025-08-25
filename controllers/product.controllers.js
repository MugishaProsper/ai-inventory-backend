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
