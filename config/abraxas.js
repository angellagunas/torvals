module.exports = {
  abraxasHostname: process.env.ABRAXAS_HOSTNAME || '',
  abraxasBaseUrl: process.env.ABRAXAS_BASE_URL || '',
  abraxasUser: process.env.ABRAXAS_USER || '',
  abraxasSecret: process.env.ABRAXAS_SECRET || '',
  abraxasS3: process.env.S3_DATASET || true
}
