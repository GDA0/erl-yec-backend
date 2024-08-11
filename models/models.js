const mongoose = require('mongoose')
const { differenceInYears } = require('date-fns')

const { Schema } = mongoose

// USER SCHEMA
const userSchema = new Schema(
  {
    firstName: String,
    middleName: String,
    lastName: String,
    username: String,
    gender: String,
    dateOfBirth: Date,
    phoneNumber: String,
    password: String,
    purpose: { type: String, default: 'learn' },
    active: { type: Boolean, default: false },
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

// CHECK-IN/OUT SCHEMA
const checkInOutSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    checkInTime: Date,
    checkOutTime: Date,
    purpose: String,
    experience: String,
    targetMet: String
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)
const CheckInOut = mongoose.model('CheckInOut', checkInOutSchema)

module.exports = {
  User,
  CheckInOut
}
