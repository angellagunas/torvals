module.exports = {
  active: process.env.EMAIL_SEND === 'true',
  mailchimpKey: process.env.EMAIL_KEY,
  sender: {
    email: 'pythia-kore@latteware.io',
    name: 'Pythia app'
  }
}
