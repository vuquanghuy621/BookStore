const express = require('express')
const router = express.Router()

const bookController = require('../controllers/books.controller')
const { verifyToken, checkRole } = require('../middlewares/auth')
const { RoleEnum } = require('../utils/enum')

router.get('/ai-recommendations/:userId', bookController.getAIRecommendations)
router.get('/', bookController.getAll)
router.get('/is-ordered/:bookId', bookController.checkIsOrdered)
router.get('/search', bookController.searchBook)
router.get('/best-seller', bookController.getBestSellers)
router.get('/bookId/:bookId', bookController.getByBookId)
router.get('/slug/:slug', bookController.getBySlug)
router.get('/:id', bookController.getById)
router.get('/:id/recommendations', bookController.getRecommendations)
router.post('/', verifyToken, checkRole([RoleEnum.Staff, RoleEnum.Admin]), bookController.create)
router.put('/:id', verifyToken, checkRole([RoleEnum.Staff, RoleEnum.Admin]), bookController.updateById)
router.delete('/:id', verifyToken, checkRole([RoleEnum.Staff, RoleEnum.Admin]), bookController.deleteById)


module.exports = router;
