/* global describe, beforeEach, it */
require('co-mocha')

const moment = require('moment')

const { Cycle, Rule, Period, Project } = require('models')
const { assert, expect } = require('chai')
const { clearDatabase, createUser, createOrganization, createFullOrganization } = require('../utils')
const { organizationFixture } = require('../fixtures')

const generateCycles = require('tasks/organization/generate-cycles')


describe('Generate cycles task', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('with one cycle by month and one month as period', () => {
    it('should generate the cycles successfully', async function () {
      const org = await createFullOrganization({})
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

      const cyclesGenerated = await Cycle.find({organization: org._id}).count()

      const firstCycle = await Cycle.findOne({
        organization: org._id,
        dateStart: new Date("2017-01-01T00:00:00Z").toISOString()
      })

      const lastCycle = await Cycle.findOne({
        organization: org._id,
        dateStart: lastCycleStartDate.format()
      })

      expect(cyclesGenerated).equal(expectedCycles)

      expect(new Date(firstCycle.dateEnd).toISOString()).equal(new Date("2017-01-31T00:00:00Z").toISOString())
      expect(
        moment(new Date(lastCycle.dateEnd).toISOString()).utc().format()
      ).equal(lastCycleEndDate.format())
    })
  })

  describe.skip('with one cycle by month and december 30, 2017 as startDate', () => {
    it('should generate a cycle with dateStart equals to rules startDate', async function () {
      const org = await createFullOrganization({}, {
        startDate: '2017-12-30T00:00:00',
        period: 'w',
      })

      const today = new Date()

      const expectedCycles = 12 + (today.getMonth() + 1) + parseInt(org.rules.cyclesAvailable)
      const cyclesGenerated = await Cycle.find({organization: org._id}).count()

      const startCycle = await Cycle.findOne({
        organization: org._id,
        dateStart: new Date("2017-12-30T00:00:00Z").toISOString()
      })

      assert.exists(startCycle)

      expect(cyclesGenerated).equal(expectedCycles)
      expect(new Date(startCycle.dateStart).toISOString()).equal(new Date("2017-12-30T00:00:00Z").toISOString())
    })
  })

  describe('with invalid data in organization', () => {
    it('send a undefined uuid should launch a exception', async function () { 
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
