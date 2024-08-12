const express = require('express')
const router = express.Router()

const adminController = require('../controllers/admin')
const auth = require('../middleware/auth')

router.post('/register', auth, adminController.handleRegisterPost)
router.post('/check-in', adminController.handleCheckInPost)

module.exports = router
