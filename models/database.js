const { User, CheckInOut } = require('./models')
const { compareDesc } = require('date-fns')

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
    let user = await User.findById(userId)

    if (user && user.active) {
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

      user = await User.findById(userId)
      user.active = false

      await checkInRecord.save()
      await user.save()
    }
  } catch (error) {
    console.error('Error during check-out:', error)
    throw error
  }
}

async function findActiveUsers () {
  try {
    const activeUsers = await User.find({
      active: true,
      role: { $ne: 'admin' } // Exclude the admin
    })

    // Map through each active user to find their latest check-in time
    const activeUsersWithCheckInTimes = await Promise.all(
      activeUsers.map(async (user) => {
        const checkInRecord = await CheckInOut.findOne({
          user: user._id,
          checkOutTime: { $exists: false }
        })

        return {
          ...user.toObject(), // Convert Mongoose document to plain JS object
          checkInTime: checkInRecord?.checkInTime || null
        }
      })
    )

    // Sort users by check-in time in descending order (most recent first)
    activeUsersWithCheckInTimes.sort((a, b) =>
      compareDesc(new Date(a.checkInTime), new Date(b.checkInTime))
    )

    return activeUsersWithCheckInTimes
  } catch (error) {
    console.error(error)
    throw error
  }
}

async function findUserRole (userId) {
  try {
    const user = await User.findById(userId)
    return user.role
  } catch (error) {
    console.error(error)
    throw error
  }
}

async function findAllUsers () {
  try {
    const allUsers = await User.find({
      role: { $ne: 'admin' }
    })
    return allUsers
  } catch (error) {
    console.error(error)
    throw error
  }
}

async function findWeeklyLogs (startOfWeek, endOfWeek) {
  try {
    const logs = await CheckInOut.find({
      date: { $gte: startOfWeek, $lte: endOfWeek }
    }).populate('user')

    return logs
  } catch (error) {
    console.error(error)
    throw error
  }
}

module.exports = {
  checkUsernameExistence,
  createUser,
  findUser,
  checkIn,
  checkOut,
  findActiveUsers,
  findUserRole,
  findAllUsers,
  findWeeklyLogs
}
