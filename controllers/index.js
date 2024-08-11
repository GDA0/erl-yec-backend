function handleDashboardGet (req, res) {
  if (req.user) {
    const { _id, firstName, purpose } = req.user
    res.json({ user: { _id, firstName, purpose } })
  } else {
    res.json({ user: null })
  }
}

module.exports = {
  handleDashboardGet
}
