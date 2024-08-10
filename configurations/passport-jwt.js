const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt')
require('dotenv').config()

const { findUser } = require('../models/database')

module.exports = function (passport) {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  }

  passport.use(
    new JwtStrategy(opts, async (jwtPayload, done) => {
      try {
        const user = await findUser('id', jwtPayload.id)
        if (user) {
          return done(null, user)
        }
        done(null, false)
      } catch (error) {
        console.error(error)
        done(error, false)
      }
    })
  )
}
