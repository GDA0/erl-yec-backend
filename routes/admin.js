const express = require('express')
const router = express.Router()

const adminController = require('../controllers/admin')
const auth = require('../middleware/auth')

router.post('/register', auth, adminController.handleRegisterPost)
router.post('/check-in', adminController.handleCheckInPost)
router.get('/dashboard', auth, adminController.handleDashboardGet)
router.post('/deactivate-user', adminController.handleDeactivateUserPost)
router.post(
  '/deactivate-all-active-users',
  adminController.handleDeactivateAllActiveUsersPost
)
router.get(
  '/generate-weekly-report',
  adminController.handleGenerateWeeklyReportPost
)

module.exports = router
