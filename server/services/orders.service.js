const Order = require('../models/orders.model')

const orderService = {
    getAll: async ({ query, page, limit, sort }) => {
        const skip = (page - 1) * limit

        return await Promise.all([
            Order.countDocuments(query),
            Order.find(query).skip(skip).limit(limit).sort(sort)])

    },
    getById: async (id) => {
        return await Order.findById(id).populate("user voucher").populate("products.product").populate("tracking.user", "fullName")
    },
    create: async ({ userId, products, delivery, voucherId, cost, method, paymentId }) => {
        const newOrder = new Order({
            user: userId,
            products,
            delivery,
            voucher: voucherId,
            cost,
            method,
            paymentId
        })
        return await newOrder.save()
    },
    updatePaymentStatusByPaymentId: async (paymentId, { paymentStatus, method }) => {
        return await Order.findOneAndUpdate({ paymentId: paymentId }, { paymentStatus, method }, { new: true })
    },
    updateStatus: async (id, { orderStatus, paymentStatus }) => {
        return await Order.findByIdAndUpdate(id, {
            orderStatus,
            paymentStatus
        }, { new: true })

    },
    updatePaymentId: async (orderId, { paymentId }) => {
        return await Order.findByIdAndUpdate(orderId, { paymentId }, { new: true })
    },
    addTracking: async (orderId, { status, time, userId }) => {
        return await Order.findByIdAndUpdate(orderId, {
            $push: {
                tracking: { status, time, user: userId }
            }
        }, { new: true })
    },
    // Thong ke
    getTotalRevenue: async () => {
        return await Order.aggregate([
            {
                $project: {
                    createdAt: 1,
                    totalCost: { $subtract: ["$cost.total", "$cost.shippingFee"] }
                }
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: "$totalCost" },
                },

            },
        ])
    },
    getRevenueWeek: async (query) => {
        const { start, end } = query
        return await Order.aggregate([
            {
                $project: {
                    createdAt: 1,
                    totalCost: { $subtract: ["$cost.total", "$cost.shippingFee"] }
                }
            },
            {
                $match: {
                    createdAt: {
                        $gte: new Date(start),
                        $lte: new Date(end),
                    },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalCost" },
                },
            },
            { $sort: { _id: 1 } },
        ])
    },
    getRevenueLifeTime: async () => {
        return await Order.aggregate([
            {
                $project: {
                    createdAt: 1,
                    totalCost: { $subtract: ["$cost.total", "$cost.shippingFee"] }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalCost" },
                },
            },
            { $sort: { _id: 1 } },
        ])
    },
    getOrderCountLifeTime: async () => {
        return await Order.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    total: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ])

    },
    getBestSeller: async () => {
        return await Order.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.product",
                    count: { $sum: "$products.quantity" }
                }
            },
            {
                $lookup: {
                    from: "books",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product",
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },

        ])
    },
    getDashboardStats: async () => {
        const now = new Date();

        // Helper to get start of day/week/month/year
        const getStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const getStartOfWeek = (d) => {
            const date = new Date(d);
            const day = date.getDay(); // 0 is Sunday
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
            return new Date(date.setDate(diff));
        };
        const getStartOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
        const getStartOfYear = (d) => new Date(d.getFullYear(), 0, 1);

        const todayStart = getStartOfDay(now);
        const weekStart = getStartOfWeek(now);
        weekStart.setHours(0, 0, 0, 0);
        const monthStart = getStartOfMonth(now);
        const yearStart = getStartOfYear(now);

        const getStatsForRange = async (startDate) => {
            const result = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        revenue: { $sum: { $subtract: ["$cost.total", "$cost.shippingFee"] } }
                    }
                }
            ]);
            return result[0] || { count: 0, revenue: 0 };
        };

        const [today, week, month, year] = await Promise.all([
            getStatsForRange(todayStart),
            getStatsForRange(weekStart),
            getStatsForRange(monthStart),
            getStatsForRange(yearStart)
        ]);

        return {
            count: {
                today: today.count,
                week: week.count,
                month: month.count,
                year: year.count
            },
            revenue: {
                today: today.revenue,
                week: week.revenue,
                month: month.revenue,
                year: year.revenue
            }
        };
    },

}

module.exports = orderService
