const Book = require('../models/books.model')
const Order = require('../models/orders.model')
const mongoose = require("mongoose");

const bookService = {
    getAll: async ({ query, page, limit, sort }) => {
        const skip = (page - 1) * limit

        return await Promise.all([
            Book.countDocuments(query),
            Book.find(query).populate('genre author publisher').skip(skip).limit(limit).sort(sort)])
    },
    getByBookId: async (bookId) => {
        return await Book.findOne({ bookId: bookId }).populate('author publisher genre')
    },
    getById: async (id) => {
        return await Book.findById(id).populate('author publisher genre')

    },
    getBySlug: async (slug) => {
        return await Book.findOne({ slug }).populate('author publisher genre')
    },
    checkIsOrdered: async (id) => {
        const ObjectId = mongoose.Types.ObjectId;
        return await Order.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.product",
                }
            },
            { $match: { _id: ObjectId(id) } }
        ])
    },
    search: async ({ key, page, limit }) => {
        const query = [
            {
                $lookup: {
                    from: "authors",
                    localField: "author",
                    foreignField: "_id",
                    as: "author"
                }
            },
            {
                $match: {
                    $or: [
                        { name: { $regex: key, $options: "i" } },
                        { "author.name": { $regex: key, $options: "i" } }
                    ]
                }
            },
        ]
        if (limit && +limit > 0) {
            const skip = (page - 1) * limit
            query.push({ $skip: skip }, { $limit: limit })
        }
        return await Book.aggregate(query)
    },
    create: async (body) => {
        const { bookId, name, year, genre, author, publisher, description,
            pages, size, price, discount, imageUrl, publicId, stock } = body

        console.log('Book creation body:', body)
        let finalBookId = bookId || `S-${Date.now()}`
        console.log('Final Book ID for testing:', finalBookId)

        const newBook = new Book({
            bookId: finalBookId, name, year, genre, description,
            author, publisher, pages, size, price, discount, imageUrl, publicId, stock: stock || 0
        })
        return await newBook.save()
    },
    updateById: async (id, body) => {
        const { name, year, genre, author, publisher, description,
            pages, size, price, discount, imageUrl, publicId, stock } = body
        const updateData = {
            name, year, genre, author, publisher, description,
            pages, size, price, discount, stock
        }

        if (imageUrl && publicId) {
            updateData.imageUrl = imageUrl
            updateData.publicId = publicId
        }

        return await Book.findByIdAndUpdate(id, updateData, { new: true })
    },
    deleteById: async (id) => {
        return await Book.findByIdAndDelete(id)
    },

    // Recommendation system - tìm sách liên quan
    getRecommendations: async (bookId, limit = 36) => {
        // Lấy thông tin sách hiện tại
        const currentBook = await Book.findById(bookId)
        if (!currentBook) return []

        const genreIds = currentBook.genre || []
        const authorIds = currentBook.author || []
        const publisherId = currentBook.publisher

        // Tìm sách có cùng genre, author hoặc publisher (trừ sách hiện tại)
        const recommendations = await Book.aggregate([
            {
                $match: {
                    _id: { $ne: currentBook._id },
                    $or: [
                        { genre: { $in: genreIds } },
                        { author: { $in: authorIds } },
                        { publisher: publisherId }
                    ]
                }
            },
            {
                // Tính điểm tương đồng
                $addFields: {
                    score: {
                        $add: [
                            // Điểm cho genre trùng (weight: 3)
                            { $multiply: [{ $size: { $setIntersection: ["$genre", genreIds] } }, 3] },
                            // Điểm cho author trùng (weight: 5)
                            { $multiply: [{ $size: { $setIntersection: ["$author", authorIds] } }, 5] },
                            // Điểm cho publisher trùng (weight: 2)
                            { $cond: [{ $eq: ["$publisher", publisherId] }, 2, 0] }
                        ]
                    }
                }
            },
            // Sắp xếp theo điểm giảm dần, sau đó theo ngày tạo mới nhất
            { $sort: { score: -1, createdAt: -1 } },
            { $limit: limit },
            // Populate các trường reference
            {
                $lookup: {
                    from: "genres",
                    localField: "genre",
                    foreignField: "_id",
                    as: "genre"
                }
            },
            {
                $lookup: {
                    from: "authors",
                    localField: "author",
                    foreignField: "_id",
                    as: "author"
                }
            },
            {
                $lookup: {
                    from: "publishers",
                    localField: "publisher",
                    foreignField: "_id",
                    as: "publisher"
                }
            },
            {
                $unwind: {
                    path: "$publisher",
                    preserveNullAndEmptyArrays: true
                }
            }
        ])

        return recommendations
    },
    getBestSellers: async (limit = 20) => {
        return await Order.aggregate([
            // 1. Tách từng sản phẩm trong order
            { $unwind: "$products" },

            // 2. ❗ LỌC DATA BẨN (fix lỗi "best-seller")
            {
                $match: {
                    "products.product": { $type: "objectId" }
                }
            },

            // 3. Gom nhóm theo BookId
            {
                $group: {
                    _id: "$products.product",
                    sold: { $sum: "$products.quantity" }
                }
            },

            // 4. Sắp xếp bán chạy
            { $sort: { sold: -1 } },

            // 5. Giới hạn
            { $limit: limit },

            // 6. Join Book
            {
                $lookup: {
                    from: "books",
                    localField: "_id",
                    foreignField: "_id",
                    as: "book"
                }
            },

            // 7. Bỏ book không tồn tại
            { $unwind: "$book" },

            // 8. Gộp data book + sold
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ["$book", { sold: "$sold" }]
                    }
                }
            },

            // 9. Populate Author
            {
                $lookup: {
                    from: "authors",
                    localField: "author",
                    foreignField: "_id",
                    as: "author"
                }
            },

            // 10. Populate Publisher
            {
                $lookup: {
                    from: "publishers",
                    localField: "publisher",
                    foreignField: "_id",
                    as: "publisher"
                }
            },

            // 11. Populate Genre
            {
                $lookup: {
                    from: "genres",
                    localField: "genre",
                    foreignField: "_id",
                    as: "genre"
                }
            },

            // 12. Publisher có thể null
            {
                $unwind: {
                    path: "$publisher",
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);
    },
    getByIds: async (ids) => {
        return await Book.find({ _id: { $in: ids } })
            .populate('genre')
            .populate('author')
            .populate('publisher');
    },
}

module.exports = bookService
