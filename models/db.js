const { User } = require("./models");

async function checkUsernameExistence(username) {
  try {
    const user = await User.findOne({ username });
    return user !== null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function createUser(userData) {
  try {
    const newUser = new User(userData);
    await newUser.save();
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

module.exports = {
  checkUsernameExistence,
  createUser,
};
