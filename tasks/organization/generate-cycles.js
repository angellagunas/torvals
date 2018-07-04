// node tasks/organization/generate-cycles.js --uuid --rule --extraDate
require('../../config')
require('lib/databases/mongo')

const moment = require('moment')
const Task = require('lib/task')

const { Organization, Cycle, Rule, Period } = require('models')

const task = new Task(
  async function (argv) {
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

    const startDate = moment.utc(rule.startDate, 'YYYY-MM-DD')
    let isEndOfMonthCycle = false
    let startOfMonth = moment.utc(startDate.format('YYYY-MM'), 'YYYY-MM').startOf('month')

    const {
      season,
      cycle,
      period,
      cycleDuration,
      periodDuration,
      cyclesAvailable,
      takeStart
    } = rule

    if (
      startDate.isSame(startOfMonth) &&
      cycle === 'M' &&
      cycleDuration === 1
    ) {
      isEndOfMonthCycle = true
    }

    let seasonDuration = moment.duration(season * cycleDuration, cycle)
    let cycleDurationMoment = moment.duration(cycleDuration, cycle)
    let periodDurationMoment = moment.duration(periodDuration, period)

    let firstStartDate = moment(startDate).subtract(seasonDuration)
    let seasonEndDate = moment(firstStartDate).add(seasonDuration).subtract(1, 'd')

    const extraDate = argv.extraDate ? moment(argv.extraDate) : firstStartDate

    /*
     * find that extraDate is and season range if the extraDate is past
     */
    while (firstStartDate.isAfter(extraDate)) {
      firstStartDate = moment(firstStartDate).subtract(seasonDuration)
      seasonEndDate = moment(firstStartDate).add(seasonDuration).subtract(1, 'd')
    }

    const cyclesToFuture = (moment().month() + 1) + parseInt(cyclesAvailable)
    const lastStartDate = moment(startDate).add(cyclesToFuture * cycleDuration, cycle)
    let lastEndDate = moment(lastStartDate).add(cycleDurationMoment).subtract(1, 'd')

    while (extraDate.isAfter(lastEndDate)) {
      lastEndDate = moment(lastEndDate).add(cycleDurationMoment)
    }

    let periodStartDate = moment(firstStartDate)
    let periodEndDate = moment(periodStartDate).add(periodDurationMoment).subtract(1, 'd')

    let periodNumber = 1
    let cycleNumber = 1
    let cycleStartDate = moment(periodStartDate)
    let cycleEndDate
    let tentativeCycleEndDate = moment(cycleStartDate).add(cycleDurationMoment).subtract(1, 'd')

    while (lastEndDate.isSameOrAfter(periodStartDate)) {
      cycleEndDate = moment(cycleStartDate).add(cycleDurationMoment).subtract(1, 'd')

      let cycleInstance = await Cycle.findOne({
        dateStart: moment(cycleStartDate),
        organization: organization._id,
        rule: rule._id,
        cycle: cycleNumber
      })

      if (!cycleInstance) {
        let cycleObj = {
          organization: organization._id,
          dateStart: cycleStartDate,
          dateEnd: cycleEndDate,
          cycle: cycleNumber,
          rule: rule._id
        }
        cycleInstance = await Cycle.create(cycleObj)
      }

      let previousPeriodEndDate

      while (tentativeCycleEndDate.isSameOrAfter(periodStartDate)) {
        if (periodEndDate.isAfter(cycleEndDate) && !takeStart) {
          break
        }

          /*
           * validate that period is in the season, and make sure the extraDate is in a period
           */
        if (periodEndDate.isSameOrAfter(seasonEndDate)) {
          let periodExists = await Period.findOne({
            dateStart: periodStartDate,
            dateEnd: seasonEndDate,
            rule: rule._id,
            organization: organization._id
          })

          if (!periodExists) {
            await Period.create({
              organization: organization._id,
              dateStart: periodStartDate,
              dateEnd: seasonEndDate,
              cycle: cycleInstance,
              period: periodNumber,
              rule: rule._id
            })
          }

          previousPeriodEndDate = moment(seasonEndDate)

          periodStartDate = moment(seasonEndDate).add(1, 'd')
          periodEndDate = moment(periodStartDate).add(periodDurationMoment).subtract(1, 'd')
          periodNumber = 1

            // Recalculate the new end date of the next season
          seasonEndDate = moment(seasonEndDate).add(seasonDuration)

          if(period === cycle){
            tentativeCycleEndDate = moment(tentativeCycleEndDate)
          }else{
            tentativeCycleEndDate = moment(tentativeCycleEndDate).subtract(cycleDurationMoment)
          }
          break
        }

        let periodExists = await Period.findOne({
          dateStart: periodStartDate,
          dateEnd: periodEndDate,
          rule: rule._id,
          organization: organization._id
        })

          /*
           * create the period only if does not exists
           */
        if (!periodExists) {
          await Period.create({
            organization: organization._id,
            dateStart: periodStartDate,
            dateEnd: periodEndDate,
            cycle: cycleInstance,
            period: periodNumber,
            rule: rule._id
          })
        }

        previousPeriodEndDate = moment(periodEndDate)

        periodStartDate = moment(periodStartDate).add(periodDurationMoment)
        periodEndDate = moment(periodStartDate).add(periodDurationMoment).subtract(1, 'd')
        periodNumber++
      }

      if (!cycleEndDate.isSame(previousPeriodEndDate)) {
        cycleInstance.set({
          dateEnd: previousPeriodEndDate
        })
        await cycleInstance.save()
      }

      if (periodNumber === 1) {
        cycleNumber = 1
      } else {
        cycleNumber++
      }

      cycleStartDate = moment(periodStartDate)
      tentativeCycleEndDate = moment(tentativeCycleEndDate).add(cycleDurationMoment)
      if (isEndOfMonthCycle) {
        tentativeCycleEndDate.endOf('month')
      }
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
