/* global describe, beforeEach, it */
require('co-mocha')

const moment = require('moment')

const { Cycle } = require('models')
const { assert, expect } = require('chai')
const { clearDatabase, createUser, createOrganization } = require('../utils')
const { organizationFixture } = require('../fixtures')

const generateCycles = require('tasks/organization/generate-cycles')


describe('Generate cycles task', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('with one cycle by month and one month as period', () => {
    it('should generate the cycles successfully', async function () {

      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()
      const org = await createOrganization({rules: {
        startDate: '2018-01-01T00:00:00',
        cycleDuration: 1,
        cycle: 'M',
        period: 'M',
        periodDuration: 1,
        season: 12,
        cyclesAvailable:6,
        catalogs: [
          "producto"
        ],
        ranges: [0, 0, 0, 0, 0, 0],
        takeStart: true,
        consolidation: 26,
        forecastCreation: 1,
        rangeAdjustment: 1,
        rangeAdjustmentRequest: 1,
        salesUpload : 1
      }})

      await generateCycles.run({uuid: org.uuid, isTest: true})

      const today = new Date()

      lastCycleStartDate = moment(
        new Date(
          today.getFullYear(),
          today.getMonth() + parseInt(org.rules.cyclesAvailable)
        )
      ).utc().set({hour:0,minute:0,second:0,millisecond:0})

      lastCycleEndDate = moment(
        new Date(
          today.getFullYear(),
          today.getMonth() + 1 + parseInt(org.rules.cyclesAvailable),
          0
        )
      ).utc().set({hour:0,minute:0,second:0,millisecond:0})

      const expectedCycles = 12 + (today.getMonth() + 1) + parseInt(org.rules.cyclesAvailable)
      const cyclesForThisYear = (today.getMonth() + 1) + parseInt(org.rules.cyclesAvailable)

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
      const org = await createOrganization({rules: {
        startDate:"2018-01-01T00:00:00",
        cycleDuration: 1,
        cycle: "aString",
        period:"M",
        periodDuration: 1,
        season: 6,
        cyclesAvailable:4
      }})

      let failed = false
      let errorMsg = ''

      try{
        const wasGenerated = await generateCycles.run({uuid: org.uuid, isTest: true})
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
      const org = await createOrganization({rules: {
        startDate:"2018-01-01T00:00:00",
        cycleDuration: -1,
        cycle: "M",
        period:"M",
        periodDuration: 1,
        season: 6,
        cyclesAvailable:4
      }})

      let failed = false
      let errorMsg = ''

      try{
        const wasGenerated = await generateCycles.run({uuid: org.uuid, isTest: true})
      } catch(error) {
        failed = true
        errorMsg = error.message
      }

      expect(failed).equals(true)
      expect(errorMsg).equals('The cycleDuration should be a positive integer')
   })

   it('sending a negative number as season should launch a exception', async function () {
      const org = await createOrganization({rules: {
        startDate:"2018-01-01T00:00:00",
        cycleDuration: 1,
        cycle: "M",
        period:"M",
        periodDuration: 1,
        season: -1,
        cyclesAvailable:4
      }})

      let failed = false
      let errorMsg = ''

      try{
        const wasGenerated = await generateCycles.run({uuid: org.uuid, isTest: true})
      } catch(error) {
        failed = true
        errorMsg = error.message
      }

      expect(failed).equals(true)
      expect(errorMsg).equals('The season should be a positive integer')
   })

   it('sending a negative number as cyclesAvailable should launch a exception', async function () {
      const org = await createOrganization({rules: {
        startDate:"2018-01-01T00:00:00",
        cycleDuration: 1,
        cycle: "M",
        period:"M",
        periodDuration: 1,
        season: 1,
        cyclesAvailable: -4
      }})

      let failed = false
      let errorMsg = ''

      try{
        const wasGenerated = await generateCycles.run({uuid: org.uuid, isTest: true})
      } catch(error) {
        failed = true
        errorMsg = error.message
      }

      expect(failed).equals(true)
      expect(errorMsg).equals('The cyclesAvailable should be a positive integer')
   })

  })
})
