// node tasks/organization/generate-cycles.js --uuid --rule --extraDate
require('../../config')
require('lib/databases/mongo')

const moment = require('moment')
const Task = require('lib/task')
const Logger = require('lib/utils/logger')

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

const getFirstDate = function (startDate, seasonDuration, firstStartDate, extraDate, periodDurationMoment, takeStart) {
  const tentativeSeasonStartDate = subtract(utc(startDate), seasonDuration)

  while(!tentativeSeasonStartDate.isAfter(firstStartDate)){
    firstStartDate = subtract(utc(firstStartDate), periodDurationMoment)
  }

  if(!takeStart){
    firstStartDate = add(utc(firstStartDate), periodDurationMoment)
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
    const log = new Logger('generate-cycles')
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

    log.call(`Starting to generate cycles`)

    let isEndOfMonthCycle = false
    let startOfMonth = moment.utc(startDate.format('YYYY-MM'), 'YYYY-MM').startOf('month')
    if (startDate.isSame(startOfMonth) && cycle === 'M' && cycleDuration === 1) {
      isEndOfMonthCycle = true
    }

    let durationToSubtract = duration(1, 'd')
    let seasonDuration = duration(season * cycleDuration, cycle)
    let cycleDurationMoment = duration(cycleDuration, cycle)
    let periodDurationMoment = duration(periodDuration, period)

    let firstStartDate = subtract(startDate, periodDurationMoment)
    const extraDate = argv.extraDate ? moment(argv.extraDate) : firstStartDate

    firstStartDate = getFirstDate(startDate, seasonDuration, firstStartDate, extraDate, periodDurationMoment, takeStart)

    let seasonEndDate = add(subtract(firstStartDate, durationToSubtract), seasonDuration)
    seasonEndDate = utc(seasonEndDate).endOf('day')
    let lastEndDate = await getLastEndDate(rule, extraDate)
    lastEndDate = utc(lastEndDate).endOf('day')

    let periodNumber = 1
    let cycleNumber = 1
    let cycleStartDate = moment(firstStartDate)
    let tentativeCycleEndDate = moment(cycleStartDate).add(cycleDurationMoment).subtract(durationToSubtract)
    tentativeCycleEndDate = utc(tentativeCycleEndDate).endOf('day')
    let firstEndDate = utc(tentativeCycleEndDate).date()
    let previousPeriodEndDate

    while (lastEndDate.isSameOrAfter(cycleStartDate)) {
      let cycleObj = {
        organization: organization._id,
        dateStart: cycleStartDate,
        rule: rule._id
      }

      let cycleInstance = await Cycle.findOne(cycleObj)
      if (cycleInstance) {
        log.call(`Updating cycle ${cycleStartDate}`)
        cycleStartDate = add(utc(cycleInstance.dateEnd), durationToSubtract)
        cycleStartDate = utc(cycleStartDate).startOf('day')

        tentativeCycleEndDate = utc(cycleInstance.dateEnd).add(cycleDurationMoment)

        previousPeriodEndDate = utc(cycleInstance.dateEnd)

        if (utc(seasonEndDate).isSame(utc(cycleInstance.dateEnd))) {
          cycleNumber = 1
          seasonEndDate = utc(seasonEndDate).add(seasonDuration)
          periodNumber = 1
        } if(utc(cycleInstance.dateEnd).isAfter(utc(seasonEndDate))) {
          seasonEndDate = subtract(utc(cycleInstance.dateEnd), cycleDurationMoment)
          seasonEndDate = add(utc(seasonEndDate), seasonDuration)
          cycleNumber = 1
          periodNumber = 1
        } else {
          cycleNumber++
          const periodsInCycle = await Period.find({cycle: cycleInstance._id}).sort({dateEnd: -1})
          periodNumber = parseInt(periodsInCycle[0].period) + 1
        }

        if (isEndOfMonthCycle) tentativeCycleEndDate.endOf('month')
        continue
      }
      cycleObj['cycle'] = cycleNumber

      log.call(`Creating cycle ${cycleStartDate} : ${cycleNumber}`)
      cycleInstance = await Cycle.create(cycleObj)

      let periodStartDate = utc(cycleStartDate)
      let periodEndDate = utc(periodStartDate).add(periodDurationMoment).subtract(durationToSubtract)
      periodEndDate = utc(periodEndDate).endOf('day')

      while (tentativeCycleEndDate.isSameOrAfter(periodStartDate)) {
        if (periodEndDate.isAfter(tentativeCycleEndDate) && !takeStart) break
        console.info('is in while')
        console.info(utc(tentativeCycleEndDate))
        console.info(utc(periodEndDate))

        let periodObj = {
          organization: organization._id,
          dateStart: periodStartDate,
          cycle: cycleInstance._id,
          period: periodNumber,
          rule: rule._id
        }

        if (periodEndDate.isSameOrAfter(seasonEndDate)) {
          if(utc(periodEndDate).isAfter(utc(seasonEndDate))){
          console.info('1111111111111111')
            console.info(utc(periodEndDate))
            console.info(utc(seasonEndDate))
            previousPeriodEndDate = subtract(utc(periodEndDate), periodDurationMoment).endOf('day')
            tentativeCycleEndDate = utc(previousPeriodEndDate)
            seasonEndDate = moment(previousPeriodEndDate).add(seasonDuration)
            periodNumber = 1
            break
          }

          periodObj['dateEnd'] = utc(periodEndDate)
          if (!await Period.findOne(periodObj)) await Period.create(periodObj)

          tentativeCycleEndDate = utc(periodEndDate)
          /*
           * if (utc(tentativeCycleEndDate).isAfter(utc(seasonEndDate))) {
           *   tentativeCycleEndDate = utc(tentativeCycleEndDate).subtract(cycleDurationMoment)
           * }
           */
          previousPeriodEndDate = utc(periodEndDate).endOf('day')
          seasonEndDate = add(utc(previousPeriodEndDate), seasonDuration)
          periodNumber = 1

          break
        }

        periodObj['dateEnd'] = periodEndDate
        if (!await Period.findOne(periodObj))await Period.create(periodObj)

        previousPeriodEndDate = utc(periodEndDate)
        periodStartDate = add(utc(periodStartDate), periodDurationMoment)
        periodEndDate = add(utc(previousPeriodEndDate), periodDurationMoment)
        periodNumber++
      }
      console.info(utc(previousPeriodEndDate))

      await cycleInstance.set({dateEnd: utc(previousPeriodEndDate)}).save()
      tentativeCycleEndDate = add(utc(tentativeCycleEndDate), cycleDurationMoment)

      if (periodNumber === 1) { cycleNumber = 0 }
      cycleNumber++

      cycleStartDate = utc(previousPeriodEndDate).add(durationToSubtract)
      cycleStartDate = utc(cycleStartDate).startOf('day')

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

    log.call(`Finished`)

    return true
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
