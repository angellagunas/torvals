const createApp = require('./pio-create-app')

createApp.run()
createApp.setCliLogger()
createApp.setCleanUp()

console.log(`PIO queues started`)
