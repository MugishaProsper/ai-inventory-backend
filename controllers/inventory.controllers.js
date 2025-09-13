import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import StockMovement from "../models/stockMovement.model.js";
import mongoose from "mongoose";

// Get user's inventory with detailed information
export const getInventory = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { 
            includeAlerts = true, 
            includeStatistics = true,
            populate = true 
        } = req.query;

        let inventory = await Inventory.findOne({ user: userId });
        
        if (!inventory) {
            // Create default inventory if none exists
            inventory = new Inventory({
                user: userId,
                name: "Main Inventory",
                products: []
            });
            await inventory.save();
        }

        if (populate) {
            await inventory.populate('products.product', 'name sku price cost quantity minStock maxStock images status');
        }

        // Generate fresh alerts if requested
        if (includeAlerts) {
            await inventory.generateAlerts();
        }

        // Update statistics if requested
        if (includeStatistics) {
            await inventory.updateStatistics();
        }

        return res.status(200).json({
            success: true,
            message: "Inventory retrieved successfully",
            data: inventory
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Add product to inventory
export const addProductToInventory = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { productId, quantity, location = "A1", reason = "Manual addition" } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Product ID and valid quantity are required"
            });
        }

        // Verify product exists and belongs to user
        const product = await Product.findOne({ _id: productId, user: userId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Get or create inventory
        let inventory = await Inventory.findOne({ user: userId });
        if (!inventory) {
            inventory = new Inventory({
                user: userId,
                name: "Main Inventory",
                products: []
            });
        }

        const previousQuantity = product.quantity;
        
        // Add to inventory
        await inventory.addProduct(productId, quantity, location);
        
        // Update product quantity
        await product.updateStock(quantity, 'add');

        // Create stock movement record
        const stockMovement = new StockMovement({
            product: productId,
            user: userId,
            type: 'in',
            quantity: quantity,
            previousQuantity: previousQuantity,
            newQuantity: product.quantity,
            unitCost: product.cost,
            reason: reason,
            location: { to: location }
        });
        await stockMovement.save();

        return res.status(200).json({
            success: true,
            message: "Product added to inventory successfully",
            data: {
                productId,
                addedQuantity: quantity,
                newTotalQuantity: product.quantity,
                location
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Remove product from inventory
export const removeProductFromInventory = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { productId, quantity, reason = "Manual removal" } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Product ID and valid quantity are required"
            });
        }

        const inventory = await Inventory.findOne({ user: userId });
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        const product = await Product.findOne({ _id: productId, user: userId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const inventoryProduct = inventory.products.find(p => 
            p.product.toString() === productId
        );

        if (!inventoryProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found in inventory"
            });
        }

        if (inventoryProduct.availableQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient available quantity. Available: ${inventoryProduct.availableQuantity}, Requested: ${quantity}`
            });
        }

        const previousQuantity = product.quantity;

        // Remove from inventory
        await inventory.removeProduct(productId, quantity);
        
        // Update product quantity
        await product.updateStock(quantity, 'subtract');

        // Create stock movement record
        const stockMovement = new StockMovement({
            product: productId,
            user: userId,
            type: 'out',
            quantity: quantity,
            previousQuantity: previousQuantity,
            newQuantity: product.quantity,
            unitCost: product.cost,
            reason: reason
        });
        await stockMovement.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from inventory successfully",
            data: {
                productId,
                removedQuantity: quantity,
                newTotalQuantity: product.quantity
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update inventory settings
export const updateInventory = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const updates = req.body;

        const inventory = await Inventory.findOne({ user: userId });
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        // Update allowed fields
        const allowedUpdates = ['name', 'description', 'location', 'type', 'settings'];
        const filteredUpdates = {};
        
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        Object.assign(inventory, filteredUpdates);
        await inventory.save();

        return res.status(200).json({
            success: true,
            message: "Inventory updated successfully",
            data: inventory
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Reserve product quantity
export const reserveProductQuantity = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { productId, quantity, reason = "Reserved for order" } = req.body;

        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Product ID and valid quantity are required"
            });
        }

        const inventory = await Inventory.findOne({ user: userId });
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        await inventory.reserveProduct(productId, quantity);

        return res.status(200).json({
            success: true,
            message: "Product quantity reserved successfully",
            data: {
                productId,
                reservedQuantity: quantity,
                reason
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get inventory alerts
export const getInventoryAlerts = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { severity = '', unreadOnly = false } = req.query;

        const inventory = await Inventory.findOne({ user: userId })
            .populate('alerts.product', 'name sku');

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        // Generate fresh alerts
        await inventory.generateAlerts();

        let alerts = inventory.alerts;

        // Filter by severity
        if (severity) {
            alerts = alerts.filter(alert => alert.severity === severity);
        }

        // Filter unread only
        if (unreadOnly === 'true') {
            alerts = alerts.filter(alert => !alert.isRead);
        }

        // Sort by severity and date
        const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
        alerts.sort((a, b) => {
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            if (severityDiff !== 0) return severityDiff;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        return res.status(200).json({
            success: true,
            message: "Inventory alerts retrieved successfully",
            data: {
                alerts: alerts.slice(0, 50), // Limit to 50 most recent
                summary: {
                    total: alerts.length,
                    critical: alerts.filter(a => a.severity === 'critical').length,
                    warning: alerts.filter(a => a.severity === 'warning').length,
                    unread: alerts.filter(a => !a.isRead).length
                }
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Mark alerts as read
export const markAlertsAsRead = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { alertIds } = req.body;

        if (!alertIds || !Array.isArray(alertIds)) {
            return res.status(400).json({
                success: false,
                message: "Alert IDs array is required"
            });
        }

        const inventory = await Inventory.findOne({ user: userId });
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        let markedCount = 0;
        inventory.alerts.forEach(alert => {
            if (alertIds.includes(alert._id.toString()) && !alert.isRead) {
                alert.isRead = true;
                markedCount++;
            }
        });

        await inventory.save();

        return res.status(200).json({
            success: true,
            message: `${markedCount} alerts marked as read`,
            data: { markedCount }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get inventory summary
export const getInventorySummary = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const inventory = await Inventory.findOne({ user: userId })
            .populate('products.product', 'name sku price cost quantity minStock maxStock category supplier');

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        await inventory.updateStatistics();

        // Get category breakdown
        const categoryBreakdown = {};
        const supplierBreakdown = {};

        for (const item of inventory.products) {
            if (item.product) {
                // Category breakdown
                const categoryName = item.product.category?.name || 'Uncategorized';
                if (!categoryBreakdown[categoryName]) {
                    categoryBreakdown[categoryName] = { count: 0, value: 0 };
                }
                categoryBreakdown[categoryName].count++;
                categoryBreakdown[categoryName].value += item.product.price * item.quantity;

                // Supplier breakdown
                const supplierName = item.product.supplier?.name || 'Unknown';
                if (!supplierBreakdown[supplierName]) {
                    supplierBreakdown[supplierName] = { count: 0, value: 0 };
                }
                supplierBreakdown[supplierName].count++;
                supplierBreakdown[supplierName].value += item.product.price * item.quantity;
            }
        }

        const summary = {
            basic: {
                totalProducts: inventory.statistics.totalProducts,
                totalValue: Math.round(inventory.statistics.totalValue * 100) / 100,
                totalCost: Math.round(inventory.statistics.totalCost * 100) / 100,
                estimatedProfit: Math.round((inventory.statistics.totalValue - inventory.statistics.totalCost) * 100) / 100
            },
            stockStatus: {
                inStock: inventory.statistics.totalProducts - inventory.statistics.lowStockItems - inventory.statistics.outOfStockItems - inventory.statistics.overstockItems,
                lowStock: inventory.statistics.lowStockItems,
                outOfStock: inventory.statistics.outOfStockItems,
                overstock: inventory.statistics.overstockItems
            },
            breakdown: {
                byCategory: categoryBreakdown,
                bySupplier: supplierBreakdown
            },
            alerts: {
                total: inventory.alerts.length,
                unread: inventory.alerts.filter(a => !a.isRead).length,
                critical: inventory.alerts.filter(a => a.severity === 'critical').length
            }
        };

        return res.status(200).json({
            success: true,
            message: "Inventory summary retrieved successfully",
            data: summary
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Transfer product between locations
export const transferProduct = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { productId, quantity, fromLocation, toLocation, reason = "Location transfer" } = req.body;

        if (!productId || !quantity || !fromLocation || !toLocation) {
            return res.status(400).json({
                success: false,
                message: "Product ID, quantity, from location, and to location are required"
            });
        }

        const inventory = await Inventory.findOne({ user: userId });
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        const product = await Product.findOne({ _id: productId, user: userId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const inventoryProduct = inventory.products.find(p => 
            p.product.toString() === productId
        );

        if (!inventoryProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found in inventory"
            });
        }

        if (inventoryProduct.availableQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: "Insufficient available quantity for transfer"
            });
        }

        // Update location in inventory
        inventoryProduct.location = toLocation;
        await inventory.save();

        // Create stock movement record
        const stockMovement = new StockMovement({
            product: productId,
            user: userId,
            type: 'transfer',
            quantity: quantity,
            previousQuantity: product.quantity,
            newQuantity: product.quantity, // Quantity doesn't change in transfer
            unitCost: product.cost,
            reason: reason,
            location: { from: fromLocation, to: toLocation }
        });
        await stockMovement.save();

        return res.status(200).json({
            success: true,
            message: "Product transferred successfully",
            data: {
                productId,
                quantity,
                fromLocation,
                toLocation,
                transferDate: new Date()
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
