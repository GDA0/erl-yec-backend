const express = require('express')
const router = express.Router()

const adminController = require('../controllers/admin')
const auth = require('../middleware/auth')

router.post('/register', auth, adminController.handleRegisterPost)
router.post('/check-in', adminController.handleCheckInPost)
router.get('/dashboard', auth, adminController.handleDashboardGet)

module.exports = router
