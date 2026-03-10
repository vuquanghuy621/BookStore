const reviewService = require('../services/reviews.service')

const reviewController = {
    create: async (req, res) => {
        try {
            const { userId } = req.user
            const { book, order } = req.body

            const canReview = await reviewService.checkUserCanReview(userId, book, order)
            if (!canReview) {
                return res.status(400).json({
                    message: 'Bạn chỉ có thể đánh giá sản phẩm đã được giao hàng thành công!',
                    error: 1
                })
            }

            const data = await reviewService.create(userId, req.body)
            res.status(201).json({
                message: 'Đánh giá thành công!',
                error: 0,
                data
            })
        } catch (error) {
            res.status(400).json({
                message: error.message,
                error: 1
            })
        }
    },
    getByBookId: async (req, res) => {
        try {
            const { bookId } = req.params
            const data = await reviewService.getByBookId(bookId)
            res.status(200).json({
                message: 'success',
                error: 0,
                data
            })
        } catch (error) {
            res.status(400).json({
                message: error.message,
                error: 1
            })
        }
    }
}

module.exports = reviewController
