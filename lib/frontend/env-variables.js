/* globals ENV, API_HOST, PREFIX, EMAIL_SEND, APP_HOST */
if (ENV !== 'production') {
  console.log('Env variables:', {ENV, API_HOST, PREFIX, EMAIL_SEND, APP_HOST, COOKIE_SUFIX})
}

export default {ENV, API_HOST, PREFIX, EMAIL_SEND, APP_HOST, COOKIE_SUFIX}
