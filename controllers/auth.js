const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const { differenceInYears } = require('date-fns')
const jwt = require('jsonwebtoken')

const {
  checkUsernameExistence,
  createUser,
  findUser
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
  body('gender').notEmpty().withMessage('Gender is required'),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isDate()
    .withMessage('Date of birth must be a valid date')
    .custom((value) => {
      const birthDate = new Date(value)
      const age = differenceInYears(new Date(), birthDate)

      return age >= 14 && age <= 24
    })
    .withMessage('You must be between 14 and 24 years old'),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^(\+233|0)[2457][0-9]{8}$/)
    .withMessage('Phone number must be a valid Ghanaian one'),
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

      res.status(201).json({ msg: 'Registration was successful' })
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
  body('purpose')
    .notEmpty()
    .withMessage('Purpose is required')
    .isIn(['learn', 'research', 'explore'])
    .withMessage('Invalid purpose selected'),

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

module.exports = {
  handleRegisterPost,
  handleCheckInPost
}
