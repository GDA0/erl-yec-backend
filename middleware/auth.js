const passport = require('passport')
const configurePassport = require('../configurations/passport-jwt')

configurePassport(passport)

const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, user) => {
    if (error) {
      console.error(error)
      return next(error)
    }

    user && (req.user = user)

    next()
  })(req, res, next)
}

module.exports = authenticate
