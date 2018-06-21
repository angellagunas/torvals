// node tasks/organization/generate-cycles.js --uuid
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
    
    const startDate = moment(rule.startDate, 'YYYY-MM-DD')
    const {
      season,
      cycle,
      period,
      cycleDuration,
      periodDuration,
      cyclesAvailable,
      takeStart
    } = rule

    const firstStartDate = moment(startDate).subtract(season, cycle)
    let seasonEndDate = moment(firstStartDate).add(season, cycle).subtract(1, 'd')

    const cyclesToFuture = (moment().month() + 1) + parseInt(cyclesAvailable)
    const lastStartDate = moment(startDate).add(cyclesToFuture, cycle)
    const lastEndDate = moment(lastStartDate).add(cycleDuration, cycle).subtract(1, 'd')

    let periodStartDate = moment(startDate)
    let periodEndDate
    let isNext
    /*
     * Find the start date of the first period
     */
    do {
      periodEndDate = moment(periodStartDate).subtract(1, 'd')
      periodStartDate = moment(periodStartDate).subtract(periodDuration, period)
      isNext = !(firstStartDate.isSameOrAfter(periodStartDate) && firstStartDate.isSameOrAfter(periodEndDate)) 
    } while (isNext)

    let periodNumber = 1
    let cycleNumber = 1
    let cycleStartDate = periodStartDate
    let cycleEndDate

    while(lastEndDate.isSameOrAfter(periodStartDate)) {
        cycleEndDate = moment(cycleStartDate).add(cycleDuration, cycle).subtract(1, 'd')

        const cycleInstance = await Cycle.create({
          organization: organization._id,
          dateStart: cycleStartDate,
          dateEnd: cycleEndDate,
          cycle: cycleNumber,
          rule: rule._id
        })

        while(cycleEndDate.isSameOrAfter(periodStartDate)) {
          if (periodEndDate.isSameOrAfter(cycleEndDate) && !takeStart){
            break
          }

          if(periodEndDate.isSameOrAfter(seasonEndDate)){
            await Period.create({
              organization: organization._id,
              dateStart: periodStartDate,
              dateEnd: seasonEndDate,
              cycle: cycleInstance,
              period: periodNumber,
              rule: rule._id
            })

            periodStartDate = moment(seasonEndDate).add(1, 'd')
            periodEndDate = moment(periodStartDate).add(periodDuration, period).subtract(1, 'd')
            periodNumber = 1
            
            // Recalculate the new end date of the next season
            seasonEndDate = moment(seasonEndDate).add(season, cycle)
            break
          }

          await Period.create({
            organization: organization._id,
            dateStart: periodStartDate,
            dateEnd: periodEndDate,
            cycle: cycleInstance,
            period: periodNumber,
            rule: rule._id
          })

          periodStartDate = moment(periodStartDate).add(periodDuration, period)
          periodEndDate = moment(periodStartDate).add(periodDuration, period).subtract(1, 'd')
          periodNumber++
        }

        const previousPeriodEndDate = moment(periodEndDate).subtract(periodDuration, period)
        if(!cycleEndDate.isSame(previousPeriodEndDate)){
          cycleInstance.set({
            dateEnd: previousPeriodEndDate
          })
          await cycleInstance.save()
        }

        if(periodNumber === 1){
            cycleNumber = 1
        } else {
            cycleNumber ++
        }

        cycleStartDate = moment(periodStartDate)
        cycleEndDate = moment(cycleStartDate).add(cycleDuration, cycle).subtract(1, 'd')
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
