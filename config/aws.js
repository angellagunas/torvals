module.exports = {
  s3AccessKey: process.env.S3_ACCESS_KEY || '',
  s3Secret: process.env.S3_SECRET || '',
  s3Region: process.env.S3_REGION || '',
  s3Bucket: process.env.S3_BUCKET || '',
  s3CDN: process.env.CDN_HOST || 'https://cdn.staging.orax.io'
}
