const { User } = require('./models')

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

module.exports = {
  checkUsernameExistence,
  createUser,
  findUser
}
