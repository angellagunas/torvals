const { Period, Rule } = require('models')

module.exports = async function (opts = {}) {
  const rule = await Rule.findOne({uuid: opts.rule})
  const periods = await Period.find({ organization: opts.org, isDeleted: false, rule: rule._id }).populate('cycle')

  let periodsArray = new Set()
  let cyclesArray = new Set()

  periods.map(item => {
    periodsArray.add(item._id)
    cyclesArray.add(item.cycle._id)
  })

  rule.set({
    periods: Array.from(periodsArray),
    cycles: Array.from(cyclesArray)
  })

  await rule.save()

  return rule
}
