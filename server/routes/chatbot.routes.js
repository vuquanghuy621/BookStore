const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');

const { identifyUser } = require('../middlewares/auth');

router.post('/', identifyUser, chatbotController.chatWithAI);


module.exports = router;
