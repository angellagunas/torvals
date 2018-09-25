const moment = require('moment')
const { Cycle } = require('models')

async function _getCurrentCycle(organization, rule) {
  const today = moment().format('YYYY-MM-DD')
  return await Cycle
    .findOne({
      organization: organization._id,
      rule: rule._id,
      dateStart: { $lte: today },
      dateEnd: { $gte: today },
      isDeleted: false
    })
    .select('dateStart')
}

async function _getCycles(organization, rule, notAdjustableCycles) {
  const currentCycle = await _getCurrentCycle(organization, rule)

  return Cycle
    .find({
      organization: organization._id,
      rule: rule._id,
      isDeleted: false,
      dateStart: {
        $gte: moment(currentCycle.dateStart).utc().format('YYYY-MM-DD')
      }
    })
    .sort({ dateStart: 1 })
    .skip(notAdjustableCycles)
    .limit(rule.cyclesAvailable)
}

async function getAdjustableCycles(organization, rule) {
  const notAdjustableCycles = 2
  return _getCycles(organization, rule, notAdjustableCycles)
}

async function getCyclesForCurrentExercise(organization, rule) {
  const notAdjustableCycles = 0
  return _getCycles(organization, rule, notAdjustableCycles)
}

module.exports.getAdjustableCycles = getAdjustableCycles
module.exports.getCyclesForCurrentExercise = getCyclesForCurrentExercise

// '.- -- -.. --.'
