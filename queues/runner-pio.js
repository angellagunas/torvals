const createForecast = require('./pio-create-app')

createForecast.run()
createForecast.setCliLogger()
createForecast.setCleanUp()
console.log(`PIO master queue started`)
