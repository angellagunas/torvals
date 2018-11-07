module.exports = {
  active: process.env.EMAIL_SEND === 'true',
  mailchimpKey: process.env.EMAIL_KEY,
  sender: {
    email: 'contact@orax.io',
    name: 'Orax app'
  }
}
