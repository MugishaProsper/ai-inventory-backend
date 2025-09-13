import Category from "../models/category.model.js";
import Product from "../models/product.model.js";

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            search = '', 
            includeInactive = false,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        const query = {};
        
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        if (!includeInactive) {
            query.isActive = true;
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const categories = await Category.find(query)
            .populate('parentCategory', 'name')
            .populate('subcategories', 'name color')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Category.countDocuments(query);

        return res.status(200).json({
            success: true,
            message: "Categories retrieved successfully",
            data: categories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
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

// Get category by ID
export const getCategoryById = async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        const category = await Category.findById(categoryId)
            .populate('parentCategory', 'name color')
            .populate('subcategories', 'name color productCount');

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Get products in this category
        const products = await Product.find({ category: categoryId })
            .select('name sku price quantity stockStatus')
            .limit(10);

        return res.status(200).json({
            success: true,
            message: "Category retrieved successfully",
            data: {
                ...category.toObject(),
                sampleProducts: products
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

// Create new category
export const createCategory = async (req, res) => {
    try {
        const { name, description, color, icon, parentCategory, sortOrder } = req.body;

        // Check if category name already exists
        const existingCategory = await Category.findOne({ 
            name: { $regex: `^${name}$`, $options: 'i' } 
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category with this name already exists"
            });
        }

        const category = new Category({
            name,
            description,
            color: color || 'bg-blue-500',
            icon: icon || 'Package',
            parentCategory,
            sortOrder: sortOrder || 0
        });

        await category.save();
        await category.populate('parentCategory', 'name');

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category
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

// Update category
export const updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const updates = req.body;

        // Check if new name conflicts with existing category
        if (updates.name) {
            const existingCategory = await Category.findOne({ 
                name: { $regex: `^${updates.name}$`, $options: 'i' },
                _id: { $ne: categoryId }
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Category with this name already exists"
                });
            }
        }

        const category = await Category.findByIdAndUpdate(
            categoryId,
            updates,
            { new: true, runValidators: true }
        ).populate('parentCategory', 'name');

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Update metadata if needed
        if (updates.name || updates.isActive !== undefined) {
            await category.updateMetadata();
        }

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category
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

// Delete category
export const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Check if category has products
        const productCount = await Product.countDocuments({ category: categoryId });
        
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It contains ${productCount} products. Please reassign or delete products first.`
            });
        }

        // Check if category has subcategories
        const subcategoryCount = await Category.countDocuments({ parentCategory: categoryId });
        
        if (subcategoryCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It has ${subcategoryCount} subcategories. Please delete or reassign subcategories first.`
            });
        }

        const category = await Category.findByIdAndDelete(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully"
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

// Get category analytics
export const getCategoryAnalytics = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { period = '30d' } = req.query;

        const days = parseInt(period.replace('d', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Get products in category
        const products = await Product.find({ category: categoryId });
        const productIds = products.map(p => p._id);

        // Calculate analytics
        const analytics = {
            totalProducts: products.length,
            totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
            totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
            averagePrice: products.length > 0 ? 
                products.reduce((sum, p) => sum + p.price, 0) / products.length : 0,
            stockStatus: {
                inStock: products.filter(p => p.stockStatus === 'in_stock').length,
                lowStock: products.filter(p => p.stockStatus === 'low_stock').length,
                outOfStock: products.filter(p => p.stockStatus === 'out_of_stock').length,
                overstock: products.filter(p => p.stockStatus === 'overstock').length
            },
            topProducts: products
                .sort((a, b) => (b.statistics?.totalSold || 0) - (a.statistics?.totalSold || 0))
                .slice(0, 5)
                .map(p => ({
                    id: p._id,
                    name: p.name,
                    sku: p.sku,
                    totalSold: p.statistics?.totalSold || 0,
                    revenue: p.statistics?.totalRevenue || 0
                }))
        };

        return res.status(200).json({
            success: true,
            message: "Category analytics retrieved successfully",
            data: {
                category: {
                    id: category._id,
                    name: category.name,
                    color: category.color
                },
                analytics,
                period: period
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

// Bulk update category metadata
export const updateAllCategoryMetadata = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        
        for (const category of categories) {
            await category.updateMetadata();
        }

        return res.status(200).json({
            success: true,
            message: `Updated metadata for ${categories.length} categories`
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