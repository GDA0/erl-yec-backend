function handleDashboardGet (req, res) {
  if (req.user) {
    const { firstName } = req.user
    res.json({ user: { firstName } })
  } else {
    res.json({ user: null })
  }
}

module.exports = {
  handleDashboardGet
}
