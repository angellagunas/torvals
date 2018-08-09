/* global describe, beforeEach, it */
require('co-mocha')

const moment = require('moment')

const { Cycle, Rule, Period, Project, Organization } = require('models')
const { assert, expect } = require('chai')
const { clearDatabase, createUser, createOrganization, createFullOrganization } = require('../utils')
const { organizationFixture } = require('../fixtures')

const generateCycles = require('tasks/organization/generate-cycles')

const dateAggregate = function(year, month, day){
  return {
    "$redact": {
      "$cond": [
        {
          "$and": [
            {"$eq": [{"$year": "$dateStart"}, year]},
            {"$eq": [{"$month": "$dateStart"}, month]},
            {"$eq": [{"$dayOfMonth": "$dateStart"}, day]}
          ]
        },
        "$$KEEP",
        "$$PRUNE"
      ]
    }
  }
}


describe('Generate cycles task', () => {
  describe('with one cycle by month and one week as period', () => {
    it('should generate the cycles successfully', async function () {
      await clearDatabase()

      const org = await createFullOrganization({},{})
      const rule = await Rule.findOne({organization: org._id})

      const startDate = moment('2018-01-01')
      const year = startDate.year()
      const month = startDate.month() + 1
      const day = startDate.date()

      let firstCycle = await Cycle.aggregate([dateAggregate(year, month, day)])
      firstCycle = firstCycle[0]

      expect(moment.utc(firstCycle.dateEnd).year()).equals(2018)
      expect(moment.utc(firstCycle.dateEnd).month() + 1).equals(2)
      expect(moment.utc(firstCycle.dateEnd).date()).equals(4)
    })

    it('and takeStart as false should generate the first cycle with dateEnd before of 31 January', async function () {
      await clearDatabase()

      const org = await createFullOrganization({}, {takeStart: false})
      const rule = await Rule.findOne({organization: org._id})

      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth()
      const day = today.getDate()
      const cyclesAvailable = rule.cyclesAvailable

      lastCycleStartDate = moment(
          new Date(year, month + parseInt(cyclesAvailable))
      ).utc().set({hour:0,minute:0,second:0,millisecond:0})

      lastCycleEndDate = moment(
        new Date(year, month + 1 + parseInt(cyclesAvailable), 0)
      ).utc().set({hour:0,minute:0,second:0,millisecond:0})

      const expectedCycles = 12 + (month + 1) + parseInt(cyclesAvailable)
      const cyclesForThisYear = (month + 1) + parseInt(cyclesAvailable)

      let firstCycle = await Cycle.aggregate([dateAggregate(2018, 1, 1)])
      firstCycle = firstCycle[0]

      expect(moment.utc(firstCycle.dateEnd).year()).equals(2018)
      expect(moment.utc(firstCycle.dateEnd).month() + 1).equals(1)
      expect(moment.utc(firstCycle.dateEnd).date()).equals(28)
    })

    it('and a extraDate before of first season should create two season before', async function () {
      await clearDatabase()
      /*
       * by default the startDate is 2018-01-01, so normally should create cycles from 2017-01-01,
       * but if we pass a date before of it, should create a season before
       */
      const { addCyclesPeriodsToRule, createRules } = require('test/utils')
      const generateCycles = require('tasks/organization/generate-cycles')
      const { organizationFixture } = require('../fixtures')

      let org = await Organization.create(Object.assign({}, organizationFixture, {}))
      let rules = {organization: org._id}
      let rule = await createRules(rules)

      await generateCycles.run({uuid: org.uuid, rule: rule.uuid, extraDate: '2016-12-12'})

      rule = await addCyclesPeriodsToRule({org: org._id, rule: rule.uuid})
      await Project.update({organization: org._id}, {outdated: true}, {multi: true})

      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth()
      const day = today.getDate()
      const cyclesAvailable = rule.cyclesAvailable

      let firstCycle = await Cycle.aggregate([dateAggregate(2018, 1, 1)])
      firstCycle = firstCycle[0]

      assert.exists(firstCycle)
    })

    it('and a extraDate after of last season should create a cycle after', async function () {
      await clearDatabase()

      const { addCyclesPeriodsToRule, createRules } = require('test/utils')
      const generateCycles = require('tasks/organization/generate-cycles')
      const { organizationFixture } = require('../fixtures')

      let org = await Organization.create(Object.assign({}, organizationFixture, {}))
      let rules = {organization: org._id}
      let rule = await createRules(rules)

      await generateCycles.run({uuid: org.uuid, rule: rule.uuid})
      rule = await addCyclesPeriodsToRule({org: org._id, rule: rule.uuid})
      await Project.update({organization: org._id}, {outdated: true}, {multi: true})

      const lastCycle = await Cycle.findOne({}).sort('-dateEnd').limit(1)
      const originalTotalCycles = await Cycle.find({}).count()

      const extraDate = moment(lastCycle.dateEnd).add(1, 'd')

      await generateCycles.run({uuid: org.uuid, rule: rule.uuid, extraDate: extraDate})
      const totalCycles = await Cycle.find({}).count()

      expect(totalCycles).equals(originalTotalCycles + 1)
    })
  })

  describe('with one cycle by month and month as period', () => {
    it('should generate the cycles succesfully', async function () {
      await clearDatabase()

      const org = await createFullOrganization({}, {period: 'M'})
      const rule = await Rule.findOne({organization: org._id})

      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth()
      const day = today.getDate()
      const cyclesAvailable = rule.cyclesAvailable

      lastCycleStartDate = moment(
          new Date(year, month + parseInt(cyclesAvailable))
      ).utc().set({hour:0,minute:0,second:0,millisecond:0})

      lastCycleEndDate = moment(
        new Date(year, month + 1 + parseInt(cyclesAvailable), 0)
      ).utc().set({hour:0,minute:0,second:0,millisecond:0})

      const expectedCycles = 12 + (month + 1) + parseInt(cyclesAvailable)
      const cyclesForThisYear = (month + 1) + parseInt(cyclesAvailable)

      let firstCycle = await Cycle.aggregate([dateAggregate(2018, 1, 1)])
      firstCycle = firstCycle[0]

      expect(moment.utc(firstCycle.dateEnd).year()).equals(2018)
      expect(moment.utc(firstCycle.dateEnd).month() + 1).equals(1)
      expect(moment.utc(firstCycle.dateEnd).date()).equals(31)
    })
  })

  describe('with one cycle by week and one week as period', () => {
    it('should generate the cycles succesfully', async function () {
      await clearDatabase()

      const org = await createFullOrganization({}, {
        startDate: moment.utc('2018-01-04'),
        periodDuration : 1,
        period: 'w',
        cycleDuration : 1,
        cycle: 'w',
        season: 4,
        cyclesAvailable: 2,
        takeStart : true,
        isCurrent: true,
        consolidation : 2,
        forecastCreation : 1,
        rangeAdjustmentRequest : 1,
        rangeAdjustment : 1,
        salesUpload : 1,
        rangesLvl2: [0, null],
        ranges: [0, null]
      })
      const rule = await Rule.findOne({organization: org._id})

      await generateCycles.run({uuid: org.uuid, rule: rule.uuid, extraDate: '2018-04-02'})

      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth()
      const day = today.getDate()
      const cyclesAvailable = rule.cyclesAvailable

      lastCycleStartDate = moment(
          new Date(year, month + parseInt(cyclesAvailable))
      ).utc().set({hour:0,minute:0,second:0,millisecond:0})

      lastCycleEndDate = moment(
        new Date(year, month + 1 + parseInt(cyclesAvailable), 0)
      ).utc().set({hour:0,minute:0,second:0,millisecond:0})

      const expectedCycles = 12 + (month + 1) + parseInt(cyclesAvailable)
      const cyclesForThisYear = (month + 1) + parseInt(cyclesAvailable)

      let firstCycle = await Cycle.aggregate([dateAggregate(2018, 1, 4)])
      firstCycle = firstCycle[0]

      expect(moment.utc(firstCycle.dateEnd).year()).equals(2018)
      expect(moment.utc(firstCycle.dateEnd).month() + 1).equals(1)
      expect(moment.utc(firstCycle.dateEnd).date()).equals(10)
    })
  })

  describe('with one cycle by month and december 30, 2017 as startDate', () => {
    it('should generate a cycle with dateStart equals to rules startDate', async function () {
      await clearDatabase()

      const org = await createFullOrganization({}, {
        startDate: '2017-12-30T00:00:00',
        period: 'w'
      })

      const today = new Date()
      const rules = await Rule.findOne({organization: org._id})

      let firstCycle = await Cycle.aggregate([dateAggregate(2017, 12, 30)])
      firstCycle = firstCycle[0]

      assert.exists(firstCycle)

      expect(moment(firstCycle.dateEnd).year()).equals(2018)
      expect(moment(firstCycle.dateEnd).month() + 1).equals(2)
      expect(moment(firstCycle.dateEnd).date()).equals(2)
    })
  })

  describe('with invalid data in organization', () => {
    it('send a undefined uuid should launch a exception', async function () { 
      await clearDatabase()

      let failed = false
      let errorMsg = ''

      try{
        const wasGenerated = await generateCycles.run({})
      } catch(error) {
          failed = true;
          errorMsg = error.message
      }

      expect(failed).equals(true)
      expect(errorMsg).equals('You need to provide an organization')
    })

    it('send a invalid cycle should launch a exception', async function () {
      await clearDatabase()

      let failed = false
      let errorMsg = ''

      try{
        const org = await createFullOrganization({}, {
          cycle: "aString"
        })
      } catch(error) {
        failed = true
        errorMsg = error.message
      }

      expect(failed).equals(true)
      expect(errorMsg).equals('The given cycle has a invalid format')
   })

   it('try generate the cycles with a organization without rules', async function () {
      await clearDatabase()

      data = organizationFixture
      data.rules = {}
      const org = await createOrganization(data)
      let failed = false

      try{
        const wasGenerated = await generateCycles.run({uuid: org.uuid, isTest: true})
      } catch(error) {
          failed = true;
      }

      expect(failed).equals(true)
    })

    it('sending a negative number as cycleDuration should launch a exception', async function () {
      await clearDatabase()

      let failed = false
      let errorMsg = ''

      try{
        const org = await createFullOrganization({}, {
          cycleDuration: -1
        })
      } catch(error) {
        failed = true
        errorMsg = error.message
      }

      expect(failed).equals(true)
      expect(errorMsg).equals('The cycleDuration should be a positive integer')
   })

   it('sending a negative number as season should launch a exception', async function () {
      await clearDatabase()

      let failed = false
      let errorMsg = ''

      try{
        const org = await createFullOrganization({}, {
          season: -1
        })
      } catch(error) {
        failed = true
        errorMsg = error.message
      }

      expect(failed).equals(true)
      expect(errorMsg).equals('The season should be a positive integer')
   })

   it('sending a negative number as cyclesAvailable should launch a exception', async function () {
      await clearDatabase()

      let failed = false
      let errorMsg = ''

      try{
        const org = await createFullOrganization({}, {
          cyclesAvailable: -4
        })
      } catch(error) {
        failed = true
        errorMsg = error.message
      }

      expect(failed).equals(true)
      expect(errorMsg).equals('The cyclesAvailable should be a positive integer')
   })

  })
})
