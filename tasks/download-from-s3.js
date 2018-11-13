// node tasks/send-user-invite.js --email admin@app.comx
const { aws } = require('../config')
require('lib/databases/mongo')
const fs = require('fs')
const awsService = require('aws-sdk')

const Task = require('lib/task')

const task = new Task(async function (argv) {
  let s3path
  let bucket = aws.s3Bucket
  let file

  if (!argv.s3path || !argv.file) {
    throw new Error('s3path, bucket and file to upload are required')
  }

  s3path = argv.s3path
  file = argv.file
  if (argv.bucket) bucket = argv.bucket

  // Create an S3 client
  var s3 = new awsService.S3({
    credentials: {
      accessKeyId: aws.s3AccessKey,
      secretAccessKey: aws.s3Secret
    },
    region: aws.s3Region
  })

  var params = {Bucket: bucket, Key: s3path}
  let data

  try {
    data = await s3.getObject(params).promise()
  } catch (e) {
    console.log(e)

    return e
  }

  console.log('Successfully downloaded data: ' + bucket + '/' + s3path)

  try {
    await fs.appendFileSync(file, data.Body)
  } catch (e) {
    console.log(e)
  }

  console.log('Saved file: ' + file)

  return file
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
