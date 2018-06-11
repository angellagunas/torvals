// node tasks/organization/generate-cycles.js --uuid --rule: ID --dateMin --dateMax
require('../../config')
require('lib/databases/mongo')

const generatePeriods = require('tasks/organization/generate-periods')
const generateRulesPeriods = require('tasks/organization/generate-rules-periods')
const moment = require('moment')
const Task = require('lib/task')

const { Organization, Cycle, Rule } = require('models')

const task = new Task(
  async function (argv) {
    let {
      uuid,
      rule,
      dateMin,
      dateMax
    } = argv
    if (!argv.uuid) {
      throw new Error('You need to provide an organization.')
    }
    if (!dateMin || !dateMax) {
      throw new Error('You need to provide a range of dates.')
    }

    const organization = await Organization.findOne({ uuid: uuid })
    rule = await Rule.findOne({uuid: rule})
    if (!rule) {
      throw new Error('Business rules not found')
    }

    const {
      cycle,
      cycleDuration,
      season,
      startDate,
      takeStart
    } = rule

    // STILL WORKING?
    if (rule !== null) {
      const rules = await Rule.findOne({ _id: rule })
      cycle = rules.cycle
      cycleDuration = rules.cycleDuration
      season = rules.season
      startDate = rules.startDate
      takeStart = rules.takeStart
    }

    const dateDiff = moment(startDate).utc().diff(moment(dateMin).utc(), 'years')
    const newEndDate = moment(dateMax).add(1, cycle)
    let newStartDate = moment(startDate).subtract(season, 'M').subtract(dateDiff, 'y')
    let currentDateDiff
    switch (cycle) {
      case 'M':
        currentDateDiff = Math.ceil(moment.duration(newEndDate.diff(newStartDate)).asMonths() / cycleDuration)
        break
      case 'w':
        currentDateDiff = Math.ceil(moment.duration(newEndDate.diff(newStartDate)).asWeeks() / cycleDuration)
        break
      case 'd':
        currentDateDiff = Math.ceil(moment.duration(newEndDate.diff(newStartDate)).asDays() / cycleDuration)
        break
      case 'y':
        currentDateDiff = Math.ceil(moment.duration(newEndDate.diff(newStartDate)).asYears() / cycleDuration)
        break
    }

    let previousYear
    let cycleNumber
    for (let i = 1; i <= currentDateDiff; i++) {
      let endDate = moment(newStartDate).utc().add(cycleDuration, cycle)
      endDate = moment(endDate).utc().subtract(1, 'd')
      let startYear = moment(newStartDate).format('YYYY')
      let endYear = moment(endDate).format('YYYY')

      if (startYear !== endYear) {
        if (takeStart) {
          cycleNumber = 1
        } else {
          cycleNumber++
        }
      } else if (previousYear !== endYear) {
        cycleNumber = 1
      } else {
        cycleNumber++
      }

      let cycleObj = await Cycle.findOne({
        dateStart: newStartDate,
        dateEnd: endDate,
        isDeleted: false,
        organization: organization._id,
        rule: rule._id
      }, {}, {
        upsert: true,
        setDefaultsOnInsert: true
      })

      if (cycleObj) {
        cycleObj.set({
          cycle: cycleNumber
        })

        await cycleObj.save()
      } else {
        await Cycle.create({
          cycle: cycleNumber,
          dateStart: newStartDate,
          dateEnd: endDate,
          isDeleted: false,
          organization: organization._id,
          rule: rule._id
        })
      }

      previousYear = endYear
      newStartDate = moment(endDate).utc().add(1, 'd')
    }

    if (rule !== null) {
      await generateRulesPeriods.run({ id: rule })
    } else {
      await generatePeriods.run({ uuid: organization.uuid })
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
