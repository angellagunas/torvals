const { Organization, Project } = require('models')
const { organizationFixture } = require('../fixtures')


module.exports = async function (opts = {}, rules={}) {
  const { addCyclesPeriodsToRule, createRules } = require('test/utils')
  const generateCycles = require('tasks/organization/generate-cycles')

  let org = await Organization.create(Object.assign({}, organizationFixture, opts))

  rules['organization'] = org._id
  let rule = await createRules(rules)

  await generateCycles.run({uuid: org.uuid, rule: rule.uuid})
  rule = await addCyclesPeriodsToRule({org: org._id, rule: rule.uuid})

  await Project.update({organization: org._id}, {outdated: true}, {multi: true})

  return org
}
