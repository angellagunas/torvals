/* global describe, beforeEach, it */
require('co-mocha')

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
        startDate:"2018-01-01T00:00:00",
        cycleDuration: 1,
        cycle: "M",
        period:"M",
        periodDuration:1,
        season: 6,
        cyclesAvailable:4
      }})

      await generateCycles.run({uuid: org.uuid, isTest: true})

      const cyclesGenerated = await Cycle.find({organization: org._id}).count()
      const firstCycle = await Cycle.findOne({organization: org._id, cycle: 1})
      const lastCycle = await Cycle.findOne({organization: org._id, cycle: 23})

      const today = new Date()

      lastCycleStartDate = new Date(
        today.getFullYear(),
        today.getMonth() + parseInt(org.cyclesAvailable)
      )

      lastCycleEndDate = new Date(
        today.getFullYear(),
        today.getMonth() + 1 + parseInt(org.cyclesAvailable),
        0
      )

      expect(cyclesGenerated).equal(23)

      expect(new Date(firstCycle.dateStart).toISOString()).equal(new Date("2017-01-01T00:00:00Z").toISOString())
      expect(new Date(firstCycle.dateEnd).toISOString()).equal(new Date("2017-01-31T00:00:00Z").toISOString())

      expect(new Date(lastCycle.dateStart).toISOString()).equal(lastCycleStartDate.toISOString())
      expect(new Date(lastCycle.dateEnd).toISOString()).equal(lastCycleEndDate.toISOString())
    })
  })

  describe('with invalid data in organization', () => {
    it('send a undefined uuid should launch a exception', async function () {

      data = organizationFixture
      data.rules.cycle = 'aString'
      const org = await createOrganization(data)
      let failed = false

      try{
        const wasGenerated = await generateCycles.run({isTest: true})
      } catch(error) {
          failed = true;
      }

      expect(failed).equals(true)
    })

    it('send a invalid cycle should launch a exception', async function () {

      data = organizationFixture
      data.rules.cycle = 'aString'
      const org = await createOrganization(data)
      let failed = false

      try{
        const wasGenerated = await generateCycles.run({uuid: org.uuid, isTest: true})
      } catch(error) {
          failed = true;
      }

      expect(failed).equals(true)
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
  })
})
