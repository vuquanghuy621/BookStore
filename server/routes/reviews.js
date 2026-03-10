const express = require('express')
const router = express.Router()

const reviewController = require('../controllers/reviews.controller')
const { verifyToken } = require('../middlewares/auth')

router.get('/book/:bookId', reviewController.getByBookId)
router.post('/', verifyToken, reviewController.create)

module.exports = router
