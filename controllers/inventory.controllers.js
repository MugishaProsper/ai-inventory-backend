import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";

export const addProductToInventory = async (req, res) => {
    const { id } = req.user;
    const { productId, quantity } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });
        let inventory = await Inventory.findOne({ user: id });
        if (!inventory) {
            inventory = new Inventory({ user: id, products: [], name: "Inventory" })
        };
        const existingItemInInventory = inventory.products.find(product =>
            product.product.toString() == productId
        );
        if (existingItemInInventory) {
            existingItemInInventory.quantity += quantity;
        } else {
            inventory.products.push({ product: productId, unitPrice: product.price, quantity })
        };
        await inventory.save();
        return res.status(200).json({ message: "Item added to inventory" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
};

export const getInventory = async (req, res) => {
    const { id } = req.user;
    try {
        const inventory = await Inventory.findOne({ user: id });
        if (!inventory || inventory.length <= 0) {
            return res.status(404).json({ message: "Inventory empty" })
        };
        return res.status(200).json({ message: "Inventory found", inventory: inventory })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
};

export const updateInventory = async (req, res) => {
    const { id } = req.user;
    const { name } = req.body;
    try {
        const inventory = await Inventory.findOne({ user: id });
        inventory.name = name;
        await inventory.save();
        return res.status(200).json({ message: "Inventory updated" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
};

export const removeProductsFromInventory = async (req, res) => {
    const { id } = req.user;
    const { productId, quantity } = req.body;
    try {
        const inventory = await Inventory.findOne({ user: id });
        if (!inventory) return res.status(404).json({ message: "Inventory not found" });
        let item = inventory.products.find(element =>
            element.product.toString() == productId
        );
        if (!item) return res.status(404).json({ message: "Product not in your inventory" });
        if (item.quantity < quantity) {
            return res.status(403).json({ message: "Stop yapping bruh, there ain't that much products" })
        };
        if (!quantity) {
            inventory.products = inventory.products.filter(element =>
                element.product.toString() !== productId
            );
        };
        item.quantity -= quantity;
        await inventory.save();
        return res.status(200).json({ message: "Product removed from inventory" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
};

/* Finesse functions */
