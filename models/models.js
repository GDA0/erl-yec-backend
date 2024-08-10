const mongoose = require('mongoose')
const { differenceInYears } = require('date-fns')

// USER
const userSchema = new mongoose.Schema(
  {
    firstName: String,
    middleName: String,
    lastName: String,
    username: String,
    dateOfBirth: Date,
    phoneNumber: String,
    password: String,
    status: { type: String, default: 'inactive' },
    roles: { type: [String], default: ['user'] }
  },
  { timestamps: true }
)

// Virtual field for full name
userSchema.virtual('fullName').get(function () {
  return `${
    this.firstName
  } ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`
})

// Virtual field for age
userSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null
  return differenceInYears(new Date(), this.dateOfBirth)
})

const User = mongoose.model('User', userSchema)

module.exports = {
  User
}
