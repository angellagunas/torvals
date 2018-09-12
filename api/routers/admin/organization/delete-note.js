const Route = require('lib/router/route')

const {Note} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/notes/:uuidnote',
  handler: async function (ctx) {
    const noteUuid = ctx.params.uuidnote
    const note = await Note.findOne({'uuid': noteUuid})
    ctx.assert(note, 404, 'Observation not found')

    note.set({ isDeleted: true })
    await note.save()
    var data = note.toAdmin()
    ctx.body = {
      data: data
    }
  }
})
