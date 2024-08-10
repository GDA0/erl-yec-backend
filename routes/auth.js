const express = require('express')
const router = express.Router()

const authController = require('../controllers/auth')

router.post('/register', authController.handleRegisterPost)
router.post('/check-in', authController.handleCheckInPost)

module.exports = router
