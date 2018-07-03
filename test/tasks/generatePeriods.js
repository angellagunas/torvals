/* global describe, beforeEach, it */
require('co-mocha')

const { Cycle, Period, Rule } = require('models')
const { assert, expect } = require('chai')
const { createCycles, clearDatabase, createUser, createOrganization, createFullOrganization } = require('../utils')
const { organizationFixture } = require('../fixtures')

const generatePeriods = require('tasks/organization/generate-periods')
const generateCycles = require('tasks/organization/generate-cycles')


describe('Generate periods task', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe.skip('with one cycle by month and only period by cycle', () => {
    it('with 23 cycles created in db should generate 23 periods', async function () {

      const org = await createFullOrganization({}, {
        period: 'w'
      })
      const rule = await Rule.findOne({organization: org._id})

      const totalCycles = await Cycle.find({organization: org._id}).count()

      const periodsGenerated = await Period.find({organization: org._id}).count()

      const today = new Date()

      lastPeriodStartDate = new Date(
        today.getFullYear(),
        today.getMonth() + parseInt(rule.cyclesAvailable)
      )

      lastPeriodEndDate = new Date(
        today.getFullYear(),
        today.getMonth() + 1 + parseInt(rule.cyclesAvailable),
        0
      )

      const expectedPeriods = 12 + (today.getMonth() + 1) + parseInt(rule.cyclesAvailable)
      const periodsForThisYear = (today.getMonth() + 1) + parseInt(rule.cyclesAvailable)

      let firstPeriod = await Period.aggregate([
        {
          "$redact": {
            "$cond": [
              {
                "$and": [
                  {"$eq": [{"$year": "$dateStart"}, 2018]},
                  {"$eq": [{"$month": "$dateStart"}, 1]},
                  {"$eq": [{"$dayOfMonth": "$dateStart"}, 1]}
                ]
              },
              "$$KEEP", 
              "$$PRUNE" 
            ]
          }
        }
      ])

      firstPeriod = firstPeriod[0]

      assert.exists(firstPeriod)

      expect(
        new Date(firstPeriod.dateEnd).toISOString().slice(0, 10)
      ).equal(
        new Date("2018-01-07").toISOString().slice(0, 10)
      )
    })
  })

  describe('with one cycle by month and period with a week as duration', () => {
    it('should generate a period with startDate equals a startDate defined on org rules', async function () {

      await clearDatabase()
      const startDate = "2017-12-30T00:00:00"

      const org = await createFullOrganization({}, {
        startDate: startDate,
        period: 'w'
      })
      const rule = await Rule.findOne({organization: org._id})

      const today = new Date()

      let startPeriod = await Period.aggregate([
        {
          "$redact": {
            "$cond": [
              {
                "$and": [
                  {"$eq": [{"$year": "$dateStart"}, 2017]},
                  {"$eq": [{"$month": "$dateStart"}, 12]},
                  {"$eq": [{"$dayOfMonth": "$dateStart"}, 30]}
                ]
              },
              "$$KEEP", 
              "$$PRUNE" 
            ]
          }
        }
      ])

      startPeriod = startPeriod[0]

      assert.exists(startPeriod)

      expect(
        new Date(startPeriod.dateEnd).toISOString().slice(0, 10)
      ).equal(
        new Date("2018-01-05").toISOString().slice(0, 10)
      )

    })
  })

  describe('with a organization with invalid rules', () => {
    it('with invalid period', async function () {
      let wasFailed = false
      let errorMsg = ''

      try{
        const org = await createFullOrganization({}, {
          startDate:"2018-01-01T00:00:00",
          period:"invalidString"
        })
        console.info(org)
      }catch(error){
          wasFailed = true
          errorMsg = error.message
      }

      expect(wasFailed).equal(true)
      expect(errorMsg).equal('The given period has a invalid format')
    })

    it('with a negative period duration', async function () {

      let wasFailed = true
      let errorMsg = ''
      try{
        const org = await createFullOrganization({}, {
          startDate:"2018-01-01T00:00:00",
          periodDuration: -1
        })
      }catch(error){
          wasFailed = true
          errorMsg = error.message
      }

      expect(wasFailed).equal(true)
      expect(errorMsg).equal('The periodDuration should be a positive integer')
    })
  })
})
