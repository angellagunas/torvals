// node tasks/send-user-invite.js --email admin@app.comx
require('../config')
require('lib/databases/mongo')
const fs = require('fs')
const aws = require('aws-sdk')

const Task = require('lib/task')

const task = new Task(async function (argv) {
  let s3path
  let bucket = 'pythia-kore-dev'
  let file
  const {
    S3_ACCESS_KEY,
    S3_SECRET
  } = process.env

  if (!argv.s3path || !argv.file) {
    throw new Error('s3path, bucket and file to upload are required')
  }

  s3path = argv.s3path
  if (argv.bucket) bucket = argv.bucket
  file = argv.file

  try {
    file = fs.createReadStream(file)
  } catch (e) {
    console.log(e)

    return e
  }

  // Create an S3 client
  var s3 = new aws.S3({
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET
    },
    region: 'us-west-2'
  })

  var params = {Bucket: bucket, Key: s3path, Body: file, ACL: 'public-read'}

  try {
    await s3.putObject(params).promise()
  } catch (e) {
    console.log(e)

    return e
  }

  console.log('Successfully uploaded data to ' + bucket + '/' + s3path)

  return bucket + '/' + s3path
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
