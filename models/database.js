const { User, CheckInOut } = require('./models')

async function checkUsernameExistence (username) {
  try {
    const user = await User.findOne({ username })
    return user !== null
  } catch (error) {
    console.error(error)
    throw error
  }
}

async function createUser (userData) {
  try {
    const newUser = new User(userData)
    await newUser.save()
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

async function findUser (method, value) {
  try {
    let user
    if (method === 'username') {
      user = await User.findOne({ username: value })
    } else if (method === 'id') {
      user = await User.findById(value)
    } else {
      throw new Error('Invalid method. Use "username" or "id".')
    }
    return user
  } catch (error) {
    console.error(error)
    throw error
  }
}

async function checkIn (userId, purpose) {
  try {
    const checkInEntry = new CheckInOut({
      user: userId,
      checkInTime: new Date(),
      purpose
    })

    const user = await User.findById(userId)
    user.active = true
    user.purpose = purpose

    await checkInEntry.save()
    await user.save()
  } catch (error) {
    console.error('Error during check-in:', error)
    throw error
  }
}

async function checkOut (userId, experience, targetMet) {
  try {
    const checkInRecord = await CheckInOut.findOne({
      user: userId,
      checkOutTime: { $exists: false } // Find the check-in record without a check-out time
    })

    if (!checkInRecord) {
      throw new Error(`No active check-in found for user with ID: ${userId}`)
    }

    checkInRecord.checkOutTime = new Date()
    checkInRecord.experience = experience
    checkInRecord.targetMet = targetMet

    const user = await User.findById(userId)
    user.active = false

    await checkInRecord.save()
    await user.save()
  } catch (error) {
    console.error('Error during check-out:', error)
    throw error
  }
}

module.exports = {
  checkUsernameExistence,
  createUser,
  findUser,
  checkIn,
  checkOut
}
