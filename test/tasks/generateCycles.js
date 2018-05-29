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

  describe('with one cycle by month and one week as period', () => {
    it('should generate the cycles successfully', async function () {
      this.timeout(1000 * 10);

      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()
      const org = await createOrganization()

      const wasGenerated = await generateCycles.run({uuid: org.uuid})
      const cyclesGenerated = await Cycle.find({organization: org._id}).count()
      const firstCycle = await Cycle.findOne({organization: org._id, cycle: 1})
      const lastCycle = await Cycle.findOne({organization: org._id, cycle: 9})

      expect(cyclesGenerated).equal(9)

      expect(new Date(firstCycle.dateStart).toISOString()).equal(new Date("2018-01-01T00:00:00Z").toISOString())
      expect(new Date(firstCycle.dateEnd).toISOString()).equal(new Date("2018-01-31T00:00:00Z").toISOString())

      expect(new Date(lastCycle.dateStart).toISOString()).equal(new Date("2018-09-01T00:00:00Z").toISOString())
      expect(new Date(lastCycle.dateEnd).toISOString()).equal(new Date("2018-09-30T00:00:00Z").toISOString())
    })
  })

  describe('with invalid data in organization', () => {
    it('send a undefined uuid should launch a exception', async function () {
      this.timeout(1000 * 10);

      data = organizationFixture
      data.rules.cycle = 'aString'
      const org = await createOrganization(data)
      let failed = false

      try{
        const wasGenerated = await generateCycles.run({})
      } catch(error) {
          failed = true;
      }

      expect(failed).equals(true)
    })

    it('send a invalid cycle should launch a exception', async function () {
      this.timeout(1000 * 10);

      data = organizationFixture
      data.rules.cycle = 'aString'
      const org = await createOrganization(data)
      let failed = false

      try{
        const wasGenerated = await generateCycles.run({uuid: org.uuid})
      } catch(error) {
          failed = true;
      }

      expect(failed).equals(true)
   })

   it('try generate the cycles with a organization without rules', async function () {
      this.timeout(1000 * 10);

      data = organizationFixture
      data.rules = {}
      const org = await createOrganization(data)
      let failed = false

      try{
        const wasGenerated = await generateCycles.run({uuid: org.uuid})
      } catch(error) {
          failed = true;
      }

      expect(failed).equals(true)
    })
  })
})
