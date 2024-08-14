const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { startOfWeek, endOfWeek, format } = require('date-fns')
const ExcelJS = require('exceljs')

const {
  checkUsernameExistence,
  createUser,
  findUser,
  findActiveUsers,
  findUserRole,
  findAllUsers,
  checkOut,
  findWeeklyLogs
} = require('../models/database')

const handleRegisterPost = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .escape(),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .escape(),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters long')
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage(
      'Username can only contain letters, numbers, underscores, or periods'
    )
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 64 })
    .withMessage('Password must be between 8 and 64 characters long')
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),

  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username, password, ...otherData } = req.body
    try {
      const usernameExists = await checkUsernameExistence(username)
      if (usernameExists) {
        return res.status(400).json({
          errors: [{ msg: 'Username is already taken' }]
        })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const userData = {
        ...otherData,
        username,
        password: hashedPassword,
        role: 'admin'
      }
      await createUser(userData)

      res.status(201).json({ msg: 'Registration was successful.' })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        errors: [
          {
            msg: 'An error occurred during registration. Please try again later.'
          }
        ]
      })
    }
  }
]

const handleCheckInPost = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters long')
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage(
      'Username can only contain letters, numbers, underscores, or periods'
    )
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 64 })
    .withMessage('Password must be between 8 and 64 characters long')
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username, password } = req.body
    try {
      const user = await findUser('username', username)
      if (!user) {
        return res.status(401).json({
          errors: [
            {
              msg: 'Incorrect username or password.'
            }
          ]
        })
      }

      const validPassword = await bcrypt.compare(password, user.password)
      if (!validPassword) {
        return res.status(401).json({
          errors: [
            {
              msg: 'Incorrect username or password.'
            }
          ]
        })
      }

      const userRole = await findUserRole(user._id)
      if (userRole !== 'admin') {
        return res.status(401).json({
          errors: [
            {
              msg: "You're not an admin."
            }
          ]
        })
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '8h'
      })

      res.json({ msg: 'Check-in was successful.', token })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        errors: [
          { msg: 'An error occurred during check-in. Please try again later.' }
        ]
      })
    }
  }
]

async function handleDashboardGet (req, res) {
  try {
    const activeUsers = await findActiveUsers()
    const allUsers = await findAllUsers()
    const user = req.user

    if (user) {
      return res.json({ user, activeUsers, allUsers })
    }

    res.json({ user: null, activeUsers, allUsers })
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
}

async function handleDeactivateUserPost (req, res) {
  try {
    const { userId } = req.body
    await checkOut(userId, '3', 'yes')
    res.sendStatus(200)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
}

async function handleDeactivateAllActiveUsersPost (req, res) {
  try {
    const activeUsers = await findActiveUsers()
    activeUsers.forEach(async (activeUser) => {
      await checkOut(activeUser._id, '3', 'yes')
    })

    res.sendStatus(200)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
}

async function handleGenerateWeeklyReportPost (req, res) {
  try {
    const today = new Date()
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 })
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 })

    const logs = await findWeeklyLogs(startOfThisWeek, endOfThisWeek)

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Weekly Report')

    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Phone Number', key: 'phoneNumber', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Check-In Time', key: 'checkInTime', width: 25 },
      { header: 'Check-Out Time', key: 'checkOutTime', width: 25 },
      { header: 'Purpose', key: 'purpose', width: 15 },
      { header: 'Experience', key: 'experience', width: 15 },
      { header: 'Target Met', key: 'targetMet', width: 15 }
    ]

    logs.forEach((entry) => {
      worksheet.addRow({
        fullName: entry.user.fullName,
        gender: entry.user.gender,
        age: entry.user.age,
        phoneNumber: entry.user.phoneNumber,
        date: format(entry.date, 'do MMMM'),
        checkInTime: format(entry.checkInTime, 'h:mm a'),
        checkOutTime: entry.checkOutTime
          ? format(entry.checkOutTime, 'h:mm a')
          : 'N/A',
        purpose: entry.purpose,
        experience: entry.experience,
        targetMet: entry.targetMet
      })
    })

    // Set headers and return the file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
}

module.exports = {
  handleRegisterPost,
  handleCheckInPost,
  handleDashboardGet,
  handleDeactivateUserPost,
  handleDeactivateAllActiveUsersPost,
  handleGenerateWeeklyReportPost
}
