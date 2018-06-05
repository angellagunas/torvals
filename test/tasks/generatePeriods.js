/* global describe, beforeEach, it */
require('co-mocha')

const { Cycle, Period } = require('models')
const { assert, expect } = require('chai')
const { createCycles, clearDatabase, createUser, createOrganization } = require('../utils')
const { organizationFixture } = require('../fixtures')

const generatePeriods = require('tasks/organization/generate-periods')


describe('Generate periods task', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('with one cycle by month and only period by cycle', () => {
    it('with 23 cycles created in db should generate 23 periods', async function () {

      const org = await createOrganization({rules: {
        startDate:"2018-01-01T00:00:00",
        cycleDuration: 1,
        cycle: "M",
        period:"M",
        periodDuration:1,
        season: 6,
        cyclesAvailable:4
      }})

      await createCycles({organization: org._id})

      const totalCycles = await Cycle.find({organization: org._id}).count()

      const wasGenerated = await generatePeriods.run({uuid: org.uuid})
      const periodsGenerated = await Period.find({organization: org._id}).count()

      const firstPeriod = await Period.findOne({organization: org._id, period: 1})
      const lastPeriod = await Period.findOne({organization: org._id, period: 23})

      const today = new Date()

      lastPeriodStartDate = new Date(
        today.getFullYear(),
        today.getMonth() + parseInt(org.rules.cyclesAvailable)
      )

      lastPeriodEndDate = new Date(
        today.getFullYear(),
        today.getMonth() + 1 + parseInt(org.rules.cyclesAvailable),
        0
      )

      const expectedPeriods = 12 + (today.getMonth() + 1) + parseInt(org.rules.cyclesAvailable)

      assert.exists(firstPeriod)
      assert.exists(lastPeriod)

      expect(periodsGenerated).equal(expectedPeriods)

      expect(
        new Date(firstPeriod.dateStart).toISOString().slice(0, 10)
      ).equal(
        new Date("2017-01-01").toISOString().slice(0, 10)
      )

      expect(
        new Date(firstPeriod.dateEnd).toISOString().slice(0, 10)
      ).equal(
        new Date("2017-01-31").toISOString().slice(0, 10)
      )

      expect(
        new Date(lastPeriod.dateStart).toISOString().slice(0, 10)
      ).equal(
        lastPeriodStartDate.toISOString().slice(0, 10)
      )

      expect(
        new Date(lastPeriod.dateEnd).toISOString().slice(0, 10)
      ).equal(
        lastPeriodEndDate.toISOString().slice(0, 10)
      )
    })
  })

  describe('with a organization with invalid rules', () => {
    it('with invalid period', async function () {
      const org = await createOrganization({rules: {
        startDate:"2018-01-01T00:00:00",
        cycleDuration: 1,
        cycle: "M",
        period:"invalidString",
        periodDuration: 1,
        season: 6,
        cyclesAvailable:4
      }})

      await createCycles({organization: org._id})

      let wasFailed = true
      let errorMsg = ''

      try{
        const wasGenerated = await generatePeriods.run({uuid: org.uuid})
      }catch(error){
          wasFailed = true
          errorMsg = error.message
      }

      expect(wasFailed).equal(true)
      expect(errorMsg).equal('The given period has a invalid format')
    })

    it('with a negative period duration', async function () {
      const org = await createOrganization({rules: {
        startDate:"2018-01-01T00:00:00",
        cycleDuration: 1,
        cycle: "M",
        period:"M",
        periodDuration: -1,
        season: 6,
        cyclesAvailable:4
      }})
      await createCycles({organization: org._id})

      let wasFailed = true
      let errorMsg = ''
      try{
        const wasGenerated = await generatePeriods.run({uuid: org.uuid})
      }catch(error){
          wasFailed = true
          errorMsg = error.message
      }

      expect(wasFailed).equal(true)
      expect(errorMsg).equal('The periodDuration should be a positive integer')
    })
  })
})
