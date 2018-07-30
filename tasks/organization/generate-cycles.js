// node tasks/organization/generate-cycles.js --uuid --rule --extraDate
require('../../config')
require('lib/databases/mongo')

const moment = require('moment')
const Task = require('lib/task')

const { Organization, Cycle, Rule, Period } = require('models')

const validateTask = async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an organization')
  }

  if (!argv.rule) {
    throw new Error('You need to provide an rule')
  }

  const organization = await Organization.findOne({uuid: argv.uuid})
  const rule = await Rule.findOne({uuid: argv.rule})

  if (!organization) {
    throw new Error('Organization not found')
  }

  if (!rule) {
    throw new Error('Business rules not found')
  }

  if (isNaN(parseInt(rule.cycleDuration)) || parseInt(rule.cycleDuration) < 1) {
    throw new Error('The cycleDuration should be a positive integer')
  }

  if (isNaN(rule.periodDuration) || parseInt(rule.periodDuration) < 1) {
    throw new Error('The periodDuration should be a positive integer')
  }

  if (!(['M', 'w', 'd', 'y'].indexOf(rule.cycle) >= 0)) {
    throw new Error('The given cycle has a invalid format')
  }

  if (!(['M', 'w', 'd', 'y'].indexOf(rule.period) >= 0)) {
    throw new Error('The given period has a invalid format')
  }

  if (isNaN(parseInt(rule.season)) || parseInt(rule.season) < 1) {
    throw new Error('The season should be a positive integer')
  }

  if (isNaN(parseInt(rule.cyclesAvailable)) || parseInt(rule.cyclesAvailable) < 1) {
    throw new Error('The cyclesAvailable should be a positive integer')
  }

  return {
    organization: organization,
    rule: rule
  }
}

const utc = function (date) {
  return moment.utc(date)
}

const format = function (date, regex = 'YYYY-MM-DD') {
  return moment.utc(date).format(regex)
}

const subtract = function (minuend, subtrahend) {
  return moment(minuend).subtract(subtrahend)
}

const add = function (firstAddend, secondAddend) {
  return moment(firstAddend).add(secondAddend)
}

const duration = function (duration, measure) {
  return moment.duration(duration, measure)
}

const hasCycle = async function (organization, rule, date) {
  const cycle = await Cycle.find({
    organization: organization,
    rule: rule,
    dateStart: { $gte: date, $lte: date },
    isDeleted: false
  }).count()

  return cycle > 0
}

const getFirstDate = function (firstStartDate, extraDate, seasonDuration) {
  while (firstStartDate.isAfter(extraDate)) {
    firstStartDate = subtract(firstStartDate, seasonDuration)
  }

  return firstStartDate
}

const getLastEndDate = async function (rule, extraDate) {
  const {
    cycle,
    cycleDuration,
    cyclesAvailable,
    organization
  } = rule
  const startDate = utc(rule.startDate)

  const cyclesToFuture = (moment().month() + 1) + parseInt(cyclesAvailable)
  const lastStartDate = moment(startDate).add(cyclesToFuture * cycleDuration, cycle)
  let cycleDurationMoment = duration(cycleDuration, cycle)
  let durationToSubtract = duration(1, 'd')
  let lastEndDate = subtract(add(lastStartDate, cycleDurationMoment), durationToSubtract)

  if (await hasCycle(organization, rule._id, extraDate)) {
    return lastEndDate
  }

  while (extraDate.isAfter(lastEndDate)) {
    lastEndDate = utc(lastEndDate).add(cycleDurationMoment)
  }

  return lastEndDate
}

const task = new Task(
  async function (argv) {
    const { organization, rule } = await validateTask(argv)
    const startDate = utc(rule.startDate)
    const {
      season,
      cycle,
      period,
      cycleDuration,
      periodDuration,
      takeStart
    } = rule

    let isEndOfMonthCycle = false
    let startOfMonth = moment.utc(startDate.format('YYYY-MM'), 'YYYY-MM').startOf('month')
    if (startDate.isSame(startOfMonth) && cycle === 'M' && cycleDuration === 1) {
      isEndOfMonthCycle = true
    }

    let durationToSubtract = duration(1, 'd')
    let seasonDuration = duration(season * cycleDuration, cycle)
    let cycleDurationMoment = duration(cycleDuration, cycle)
    let periodDurationMoment = duration(periodDuration, period)

    let firstStartDate = subtract(startDate, seasonDuration)
    const extraDate = argv.extraDate ? moment(argv.extraDate) : firstStartDate

    firstStartDate = getFirstDate(firstStartDate, extraDate, seasonDuration)

    let seasonEndDate = subtract(add(firstStartDate, seasonDuration), durationToSubtract)
    let lastEndDate = await getLastEndDate(rule, extraDate)

    let periodNumber = 1
    let cycleNumber = 1
    let cycleStartDate = moment(firstStartDate)
    let tentativeCycleEndDate = moment(cycleStartDate).add(cycleDurationMoment).subtract(durationToSubtract)
    let firstEndDate = utc(tentativeCycleEndDate).date()
    let previousPeriodEndDate

    while (lastEndDate.isSameOrAfter(cycleStartDate)) {
      let cycleObj = {
        organization: organization._id,
        dateStart: cycleStartDate,
        cycle: cycleNumber,
        rule: rule._id
      }

      let cycleInstance = await Cycle.findOne(cycleObj)
      if (cycleInstance) {
        cycleStartDate = add(utc(cycleInstance.dateEnd), durationToSubtract)

        if (period === cycle) {
          tentativeCycleEndDate = utc(tentativeCycleEndDate)
        } else {
          tentativeCycleEndDate = utc(tentativeCycleEndDate).add(cycleDurationMoment)
        }

        previousPeriodEndDate = utc(cycleInstance.dateEnd)

        if (utc(seasonEndDate).isSame(utc(cycleInstance.dateEnd))) {
          cycleNumber = 1
          seasonEndDate = utc(seasonEndDate).add(seasonDuration)
        } else {
          cycleNumber++
          const periodsInCycle = await Period.find({cycle: cycleInstance._id}).sort({dateEnd: -1})
          periodNumber = parseInt(periodsInCycle[0].period) + 1
        }

        if (isEndOfMonthCycle) tentativeCycleEndDate.endOf('month')
        continue
      }

      cycleInstance = await Cycle.create(cycleObj)

      let periodStartDate = utc(cycleStartDate)
      let periodEndDate = utc(periodStartDate).add(periodDurationMoment).subtract(durationToSubtract)

      while (tentativeCycleEndDate.isSameOrAfter(periodStartDate)) {
        if (periodEndDate.isAfter(tentativeCycleEndDate) && !takeStart) break

        let periodObj = {
          organization: organization._id,
          dateStart: periodStartDate,
          cycle: cycleInstance._id,
          period: periodNumber,
          rule: rule._id
        }

        if (periodEndDate.isSameOrAfter(seasonEndDate)) {
          periodObj['dateEnd'] = seasonEndDate
          if (!await Period.findOne(periodObj)) await Period.create(periodObj)

          tentativeCycleEndDate = moment.utc(format(tentativeCycleEndDate), 'YYYY-MM-DD')
          if (utc(tentativeCycleEndDate).isAfter(utc(seasonEndDate))) {
            tentativeCycleEndDate = utc(tentativeCycleEndDate).subtract(cycleDurationMoment)
          }

          previousPeriodEndDate = utc(seasonEndDate)
          seasonEndDate = moment(seasonEndDate).add(seasonDuration)
          periodNumber = 1

          break
        }

        periodObj['dateEnd'] = periodEndDate
        if (!await Period.findOne(periodObj)) await Period.create(periodObj)

        previousPeriodEndDate = utc(periodEndDate)
        periodStartDate = utc(periodStartDate).add(periodDurationMoment)
        periodEndDate = utc(periodStartDate).add(periodDurationMoment).subtract(1, 'd')
        periodNumber++
      }

      await cycleInstance.set({dateEnd: utc(previousPeriodEndDate)}).save()
      tentativeCycleEndDate = utc(tentativeCycleEndDate).add(cycleDurationMoment)

      if (periodNumber === 1) { cycleNumber = 0 }
      cycleNumber++

      cycleStartDate = utc(previousPeriodEndDate).add(durationToSubtract)

      if (utc(tentativeCycleEndDate).date() !== firstEndDate && cycle === 'm') {
        const endOfMonth = utc(tentativeCycleEndDate).endOf('month').date()
        if (endOfMonth < firstEndDate) {
          tentativeCycleEndDate = utc(tentativeCycleEndDate).set('date', endOfMonth)
        } else {
          tentativeCycleEndDate = utc(tentativeCycleEndDate).set('date', firstEndDate)
        }
      }

      if (isEndOfMonthCycle) tentativeCycleEndDate.endOf('month')
    }

    return true
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
