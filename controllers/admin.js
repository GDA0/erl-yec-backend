const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')

const {
  checkUsernameExistence,
  createUser
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
      const userData = { ...otherData, username, password: hashedPassword }
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

module.exports = {
  handleRegisterPost
}
