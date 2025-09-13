/**
 * AI and Machine Learning utility functions for inventory management
 */

/**
 * Simple moving average calculation
 */
export const calculateMovingAverage = (data, window = 7) => {
    if (data.length < window) return data[data.length - 1] || 0;
    
    const recent = data.slice(-window);
    return recent.reduce((sum, val) => sum + val, 0) / window;
};

/**
 * Linear regression for trend analysis
 */
export const calculateTrend = (data) => {
    if (data.length < 2) return { slope: 0, trend: 'stable' };
    
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    let trend = 'stable';
    if (slope > 0.1) trend = 'increasing';
    else if (slope < -0.1) trend = 'decreasing';
    
    return { slope, trend };
};

/**
 * Seasonal decomposition (simplified)
 */
export const detectSeasonality = (data, period = 7) => {
    if (data.length < period * 2) return { seasonal: false, factor: 1.0 };
    
    const seasons = [];
    for (let i = 0; i < period; i++) {
        const seasonalData = [];
        for (let j = i; j < data.length; j += period) {
            seasonalData.push(data[j]);
        }
        seasons.push(calculateMovingAverage(seasonalData));
    }
    
    const overallMean = calculateMovingAverage(data);
    const seasonalVariance = seasons.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0) / seasons.length;
    
    return {
        seasonal: seasonalVariance > overallMean * 0.1,
        factor: Math.max(...seasons) / overallMean,
        pattern: seasons
    };
};

/**
 * Demand forecasting using exponential smoothing
 */
export const forecastDemand = (historicalData, periods = 30, alpha = 0.3) => {
    if (historicalData.length === 0) return Array(periods).fill(0);
    
    let forecast = historicalData[0];
    const forecasts = [forecast];
    
    // Calculate exponential smoothing
    for (let i = 1; i < historicalData.length; i++) {
        forecast = alpha * historicalData[i] + (1 - alpha) * forecast;
        forecasts.push(forecast);
    }
    
    // Project future periods
    const futureForecast = [];
    let lastForecast = forecasts[forecasts.length - 1];
    
    for (let i = 0; i < periods; i++) {
        futureForecast.push(Math.max(0, lastForecast));
    }
    
    return futureForecast;
};

/**
 * Calculate reorder point using lead time and demand variability
 */
export const calculateReorderPoint = (averageDemand, leadTimeDays = 7, serviceLevel = 0.95) => {
    // Safety stock calculation (simplified)
    const demandVariability = averageDemand * 0.2; // Assume 20% variability
    const zScore = getZScore(serviceLevel);
    const safetyStock = zScore * demandVariability * Math.sqrt(leadTimeDays);
    
    return Math.ceil(averageDemand * leadTimeDays + safetyStock);
};

/**
 * Get Z-score for given service level
 */
const getZScore = (serviceLevel) => {
    const zScores = {
        0.90: 1.28,
        0.95: 1.65,
        0.99: 2.33
    };
    return zScores[serviceLevel] || 1.65;
};

/**
 * Economic Order Quantity (EOQ) calculation
 */
export const calculateEOQ = (annualDemand, orderingCost = 50, holdingCost = 0.25, unitCost = 1) => {
    const annualHoldingCost = unitCost * holdingCost;
    return Math.sqrt((2 * annualDemand * orderingCost) / annualHoldingCost);
};

/**
 * ABC Analysis classification
 */
export const performABCAnalysis = (items) => {
    // Sort items by value (price * quantity) in descending order
    const sortedItems = items
        .map(item => ({
            ...item,
            value: (item.price || 0) * (item.quantity || 0)
        }))
        .sort((a, b) => b.value - a.value);
    
    const totalValue = sortedItems.reduce((sum, item) => sum + item.value, 0);
    
    let cumulativeValue = 0;
    const classifiedItems = sortedItems.map(item => {
        cumulativeValue += item.value;
        const cumulativePercent = (cumulativeValue / totalValue) * 100;
        
        let category = 'C';
        if (cumulativePercent <= 80) category = 'A';
        else if (cumulativePercent <= 95) category = 'B';
        
        return {
            ...item,
            category,
            cumulativePercent: Math.round(cumulativePercent * 100) / 100
        };
    });
    
    return classifiedItems;
};

/**
 * Anomaly detection using statistical methods
 */
export const detectAnomalies = (data, threshold = 2.5) => {
    if (data.length < 3) return [];
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    const anomalies = [];
    data.forEach((value, index) => {
        const zScore = Math.abs((value - mean) / stdDev);
        if (zScore > threshold) {
            anomalies.push({
                index,
                value,
                zScore: Math.round(zScore * 100) / 100,
                type: value > mean ? 'spike' : 'drop'
            });
        }
    });
    
    return anomalies;
};

/**
 * Price optimization using elasticity
 */
export const optimizePrice = (currentPrice, currentDemand, priceElasticity = -1.5, targetMargin = 0.3) => {
    // Simple price optimization
    const priceChangeOptions = [-0.1, -0.05, 0, 0.05, 0.1]; // ±10% price changes
    
    const scenarios = priceChangeOptions.map(change => {
        const newPrice = currentPrice * (1 + change);
        const demandChange = priceElasticity * change;
        const newDemand = currentDemand * (1 + demandChange);
        const revenue = newPrice * newDemand;
        
        return {
            priceChange: change,
            newPrice: Math.round(newPrice * 100) / 100,
            newDemand: Math.round(newDemand),
            revenue: Math.round(revenue * 100) / 100,
            revenueChange: ((revenue - (currentPrice * currentDemand)) / (currentPrice * currentDemand)) * 100
        };
    });
    
    // Return scenario with highest revenue
    return scenarios.sort((a, b) => b.revenue - a.revenue)[0];
};

/**
 * Confidence score calculation for predictions
 */
export const calculateConfidence = (historicalAccuracy, dataQuality, modelComplexity = 0.7) => {
    // Simple confidence calculation based on multiple factors
    const accuracy = Math.max(0, Math.min(1, historicalAccuracy || 0.5));
    const quality = Math.max(0, Math.min(1, dataQuality || 0.5));
    
    const confidence = (accuracy * 0.5 + quality * 0.3 + modelComplexity * 0.2);
    return Math.round(confidence * 100) / 100;
};

/**
 * Generate insights based on data patterns
 */
export const generateInsights = (product, historicalData = []) => {
    const insights = [];
    
    // Stock level insights
    if (product.quantity <= product.minStock) {
        insights.push({
            type: 'reorder_suggestion',
            severity: product.quantity === 0 ? 'critical' : 'high',
            message: `${product.name} needs reordering`,
            action: 'reorder',
            confidence: 0.9
        });
    }
    
    // Trend insights
    if (historicalData.length > 7) {
        const trend = calculateTrend(historicalData.slice(-30));
        if (trend.trend === 'increasing') {
            insights.push({
                type: 'demand_increase',
                severity: 'medium',
                message: `Increasing demand trend detected for ${product.name}`,
                action: 'increase_stock',
                confidence: 0.7
            });
        }
    }
    
    // Profit margin insights
    const margin = ((product.price - product.cost) / product.price) * 100;
    if (margin < 10) {
        insights.push({
            type: 'low_margin',
            severity: 'medium',
            message: `Low profit margin (${margin.toFixed(1)}%) for ${product.name}`,
            action: 'review_pricing',
            confidence: 0.8
        });
    }
    
    return insights;
};