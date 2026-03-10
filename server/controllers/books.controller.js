const bookService = require('../services/books.service')
const redis = require('../config/redis')
const { cloudinary } = require('../config/cloudinary')

const bookController = {
    getAll: async (req, res) => {
        try {
            const page = req.query.page ? parseInt(req.query.page) : 1
            const limit = req.query.limit ? parseInt(req.query.limit) : 0
            const sort = req.query.sort ? req.query.sort : { createdAt: -1 }
            const { query } = req.query

            const queryObj = !!query ? query : {}

            const key = `Book::${JSON.stringify({ queryObj, page, limit, sort })}`

            let count, data, totalPage

            try {
                const cache = await redis.get(key)

                if (cache) {
                    const json = JSON.parse(cache)
                    count = json.count
                    data = json.data
                } else {
                    const [countNum, bookList] = await bookService.getAll({ query: queryObj, page, limit, sort })
                    count = countNum
                    data = bookList
                    redis.setex(key, 600, JSON.stringify({ count, data }))
                }

            } catch (error) {
                const [countNum, bookList] = await bookService.getAll({ query: queryObj, page, limit, sort })
                count = countNum
                data = bookList
                console.log('Redis error::::' + error.message)
            }

            totalPage = Math.ceil(count / limit)

            res.status(200).json({
                message: 'success',
                error: 0,
                data,
                count,
                pagination: {
                    page,
                    limit,
                    totalPage,
                }
            })
        } catch (error) {
            res.status(500).json({
                message: `Có lỗi xảy ra! ${error.message}`,
                error: 1,
            })
        }
    },
    getByBookId: async (req, res) => {
        try {
            const { bookId } = req.params
            const data = await bookService.getByBookId(bookId)

            if (data) {
                res.status(200).json({
                    message: 'success',
                    error: 0,
                    data
                })
            } else {
                res.status(200).json({
                    message: 'Không tìm thấy sách!',
                    error: 1,
                    data
                })
            }
        } catch (error) {
            res.status(500).json({
                message: `Có lỗi xảy ra! ${error.message}`,
                error: 1,
            })
        }
    },
    getById: async (req, res) => {
        try {
            const { id } = req.params
            const data = await bookService.getById(id)

            if (data) {
                res.status(200).json({
                    message: 'success',
                    error: 0,
                    data
                })
            } else {
                res.status(404).json({
                    message: 'Không tìm thấy sách!',
                    error: 1,
                    data
                })
            }
        } catch (error) {
            res.status(500).json({
                message: `Có lỗi xảy ra! ${error.message}`,
                error: 1,
            })
        }
    },
    getBySlug: async (req, res) => {
        try {
            const { slug } = req.params

            let response

            const key = `Book::${slug}`

            try {
                const cache = await redis.get(key)

                if (cache) {
                    response = JSON.parse(cache).response
                } else {
                    response = await bookService.getBySlug(slug)
                    redis.setex(key, 600, JSON.stringify({ response }))
                }

            } catch (error) {
                response = await bookService.getBySlug(slug)
                console.log('Redis error::::' + error.message)
            }

            if (response) {
                res.status(200).json({
                    message: 'success',
                    error: 0,
                    data: response
                })
            } else {
                res.status(404).json({
                    message: 'Không tìm thấy sách!',
                    error: 1,
                    data: response
                })
            }
        } catch (error) {
            res.status(500).json({
                message: `Có lỗi xảy ra! ${error.message}`,
                error: 1,
            })
        }
    },
    checkIsOrdered: async (req, res) => {
        try {
            const { bookId } = req.params
            const data = await bookService.checkIsOrdered(bookId)

            if (data.length > 0) {
                res.status(200).json({
                    message: 'success',
                    error: 0,
                    data
                })
            } else {
                res.status(200).json({
                    message: 'Không tìm thấy!',
                    error: 1,
                    data
                })
            }
        } catch (error) {
            res.status(500).json({
                message: `Có lỗi xảy ra! ${error.message}`,
                error: 1,
            })
        }
    },
    searchBook: async (req, res) => {
        try {
            const { key } = req.query
            const page = req.query.page ? parseInt(req.query.page) : 1
            const limit = req.query.limit ? parseInt(req.query.limit) : 0
            const data = await bookService.search({ key, page, limit })

            res.status(200).json({
                message: 'success',
                error: 0,
                data
            })

        } catch (error) {
            res.status(500).json({
                message: `Có lỗi xảy ra! ${error.message}`,
                error: 1,
            })
        }
    },
    create: async (req, res) => {
        // throw new Error("CONTROLLER IS LIVE")
        try {
            const { bookId } = req.body
            if (bookId) {
                const isExist = await bookService.getByBookId(bookId)
                if (isExist) return res.status(400).json({ message: "bookId đã tồn tại!", error: 1 })
            }
            const data = await bookService.create(req.body)
            return res.status(201).json({
                message: 'success',
                error: 0,
                data
            })
        } catch (error) {
            res.status(400).json({
                message: `Có lỗi xảy ra! ${error.message}`,
                error: 1,
            })
        }
    },
    updateById: async (req, res) => {
        try {
            const { id } = req.params
            const { imageUrl, publicId } = req.body
            console.log(req.body);

            let data = null
            if (imageUrl && publicId) {
                const { data: bookUpdate } = await bookService.getById(id)

                data = await bookService.updateById(id, req.body)
            } else {
                data = await bookService.updateById(id, req.body)
            }

            if (data) {
                return res.status(200).json({
                    message: 'success',
                    error: 0,
                    data
                })
            } else {
                return res.status(404).json({
                    message: `Không tìm thấy sách có id:${id}`,
                    error: 1,
                    data
                })
            }

        } catch (error) {
            console.log(error);

            res.status(400).json({
                message: `Có lỗi xảy ra! ${error.message}`,
                error: 1,
            })
        }
    },
    deleteById: async (req, res) => {
        try {
            const { id } = req.params
            const isOrdered = await bookService.checkIsOrdered(id)
            if (isOrdered.length > 0) return res.status(400).json({ message: 'Sản phẩm đã được mua!', error: 1 })
            const data = await bookService.deleteById(id)
            if (data) {
                await cloudinary.uploader.destroy(data?.publicId)

                return res.status(200).json({
                    message: 'success',
                    error: 0,
                    data
                })
            } else {
                return res.status(404).json({
                    message: `Không tìm thấy sách có id:${id}`,
                    error: 1,
                    data
                })
            }

        } catch (error) {
            res.status(400).json({
                message: `Có lỗi xảy ra! ${error.message}`,
                error: 1,
            })
        }
    },

    // API gợi ý sách liên quan
    getRecommendations: async (req, res) => {
        try {
            const { id } = req.params
            const limit = req.query.limit ? parseInt(req.query.limit) : 36

            const key = `Book::recommendations::${id}::${limit}`
            let data

            try {
                const cache = await redis.get(key)

                if (cache) {
                    data = JSON.parse(cache)
                } else {
                    data = await bookService.getRecommendations(id, limit)
                    redis.setex(key, 600, JSON.stringify(data)) // Cache 10 phút
                }
            } catch (error) {
                data = await bookService.getRecommendations(id, limit)
                console.log('Redis error::::' + error.message)
            }

            res.status(200).json({
                message: 'success',
                error: 0,
                data,
                count: data.length
            })
        } catch (error) {
            res.status(500).json({
                message: `Có lỗi xảy ra! ${error.message}`,
                error: 1,
            })
        }
    },
    getBestSellers: async (req, res) => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 20
            const key = `Book::BestSellers::${limit}`
            let data

            try {
                const cache = await redis.get(key)
                if (cache) {
                    data = JSON.parse(cache)
                } else {
                    data = await bookService.getBestSellers(limit)
                    redis.setex(key, 600, JSON.stringify(data))
                }
            } catch (error) {
                data = await bookService.getBestSellers(limit)
                console.log('Redis error::::' + error.message)
            }

            res.status(200).json({
                message: 'success',
                error: 0,
                data
            })
        } catch (error) {
            res.status(500).json({
                message: `Có lỗi xảy ra! ${error.message}`,
                error: 1,
            })
        }
    },
    async getAIRecommendations(req, res) {
        try {
            const { userId } = req.params;
            const axios = require('axios');
            const ai_url = `http://localhost:${process.env.AI_PORT || 5050}/recommend/${userId}`;

            const ai_res = await axios.get(ai_url);
            const bookIds = ai_res.data.data;

            // Hydrate book data from IDs
            const books = await bookController.getByIdsFromIds(bookIds);

            res.status(200).json({
                message: 'success',
                error: 0,
                data: books
            });
        } catch (error) {
            console.error('AI Rec error:', error.message);
            // Fallback to normal recommendations if AI fails
            // Current route is /ai-recommendations/:userId
            // Target route is /:id/recommendations
            res.redirect(`${req.baseUrl}/${req.params.userId || 'none'}/recommendations`);
        }
    },
    async getByIdsFromIds(ids) {
        return await require('../services/books.service').getByIds(ids);
    }
}

module.exports = bookController
