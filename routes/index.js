const express = require('express')
const router = express.Router()

const indexController = require('../controllers/index')
const auth = require('../middleware/auth')

router.get('/dashboard', auth, indexController.handleDashboardGet)

module.exports = router
