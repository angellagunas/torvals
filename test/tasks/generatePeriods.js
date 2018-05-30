/* global describe, beforeEach, it */
require('co-mocha')

const { Cycle, Period } = require('models')
const { assert, expect } = require('chai')
const { clearDatabase, createUser, createOrganization } = require('../utils')
const { organizationFixture } = require('../fixtures')

const generateCycles = require('tasks/organization/generate-cycles')


describe('Generate periods task', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('with one cycle by month and only period by cycle', () => {
    it('with 4 available cycles should generate 16 periods', async function () {
      this.timeout(1000 * 10);

      const org = await createOrganization()

      const wasGenerated = await generateCycles.run({uuid: org.uuid})
      const periodsGenerated = await Cycle.find({organization: org._id}).count()
      const firstCycle = await Cycle.findOne({organization: org._id, cycle: 1})
      const lastCycle = await Cycle.findOne({organization: org._id, cycle: 16})

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

      expect(periodsGenerated).equal(16)

      expect(new Date(firstCycle.dateStart).toISOString()).equal(new Date("2017-01-01T00:00:00Z").toISOString())
      expect(new Date(firstCycle.dateEnd).toISOString()).equal(new Date("2017-01-31T00:00:00Z").toISOString())

      expect(new Date(lastCycle.dateStart).toISOString()).equal(lastCycleStartDate.toISOString())
      expect(new Date(lastCycle.dateEnd).toISOString()).equal(lastCycleEndDate.toISOString())
    })

    it.only('without organization uuid', async function () {
      this.timeout(1000 * 10);

      const org = await createOrganization()
      let wasFailed = false
      let errorMsg = ''

      try{
        const wasGenerated = await generateCycles.run({})
      }catch(error){
        errorMsg = error.message
        wasFailed = true
      }

      expect(wasFailed).equal(true)
      expect(errorMsg).equal('You need to provide an organization')
    })

    it('with invalid organization uuid', async function () {
      this.timeout(1000 * 10);
      let wasFailed = false
      let errorMsg = ''

      try{
        const wasGenerated = await generateCycles.run({uuid: 'invalid-uuid'})
      }catch(error){
        errorMsg = error.message
        wasFailed = true
      }

      expect(wasFailed).equal(true)
      expect(errorMsg).equal('Organization not found')
    })

    it.only('with invalid organization uuid', async function () {
      this.timeout(1000 * 10);

      let data = organizationFixture
      data.rules = {}

      const org = await createOrganization(data)
      let wasFailed = false
      let errorMsg = ''

      try{
        const wasGenerated = await generateCycles.run({uuid: org.uuid})
      }catch(error){
        errorMsg = error.message
        wasFailed = true
      }

      expect(wasFailed).equal(true)
      expect(errorMsg).equal('Organization do not have rules assigned')
    })

  })
})
