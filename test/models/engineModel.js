/* global describe, beforeEach, it */
require('co-mocha')

const moment = require('moment')

const { assert, expect } = require('chai')
const { Engine } = require('models')
const { clearDatabase } = require('../utils')


describe('Engine Model', () => {

  describe('should be saved success', () => {
    it('with full data', async function () {
      await clearDatabase()

      const data = {
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries'
      }

      const instance = await Engine.create(data)

      assert.exists(instance)
    })

    it('without description', async function () {
      await clearDatabase()

      const data = {
        name: 'regression',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries'
      }

      const instance = await Engine.create(data)

      assert.exists(instance)
    })

    it('without instructions', async function () {
      await clearDatabase()

      const data = {
        name: 'regression',
        descrition: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io'
      }

      const instance = await Engine.create(data)

      assert.exists(instance)
    })
  })

  describe('should return an error', () => {
    it('with duplicate uuid', async function(){
      await clearDatabase()

      const data = {
        name: 'regression',
        descrition: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries',
        uuid: 'a-duplicate-uuid'
      }

      let wasFailed = false

      try {
        const firstModel = await Engine.create(data)
        const secondModel = await Engine.create(data)
      }catch(error){
        wasFailed = true
      }

      expect(wasFailed).equals(true)
    })

    it('without name', async function(){
      await clearDatabase()

      const data = {
        descrition: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries',
        uuid: 'a-duplicate-uuid'
      }

      let wasFailed = false

      try {
        const firstModel = await Engine.create(data)
      }catch(error){
        wasFailed = true
      }

      expect(wasFailed).equals(true)
    })

    it('without path', async function(){
      await clearDatabase()

      const data = {
        name: 'regression',
        descrition: 'a models with perfect prediction',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries',
        uuid: 'a-duplicate-uuid'
      }

      let wasFailed = false

      try {
        const firstModel = await Engine.create(data)
      }catch(error){
        wasFailed = true
      }

      expect(wasFailed).equals(true)
    })
  })
})
