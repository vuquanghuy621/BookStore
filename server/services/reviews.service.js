const Review = require('../models/reviews.model')
const Order = require('../models/orders.model')

const reviewService = {
    create: async (userId, body) => {
        const { book, order, rating, comment } = body

        // Check if user has already reviewed this product from this order
        const isExist = await Review.findOne({ user: userId, book, order })
        if (isExist) throw new Error('Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi!')

        const newReview = new Review({
            user: userId,
            book,
            order,
            rating,
            comment
        })
        return await newReview.save()
    },
    getByBookId: async (bookId) => {
        return await Review.find({ book: bookId }).populate('user', 'fullName avatarUrl')
    },
    checkUserCanReview: async (userId, bookId, orderId) => {
        const order = await Order.findOne({
            _id: orderId,
            user: userId,
            'products.product': bookId,
            'orderStatus.code': 5 // Delivered
        })
        return !!order
    }
}

module.exports = reviewService
