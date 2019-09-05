const tunnel = require("tunnel-ssh");

const tunnelPromised = (config) => {
  return new Promise((resolve, reject) => {
    tunnel(config, (err, server) => {
      if (err) reject(err);

      resolve(server);
    });
  })
}

module.exports = tunnelPromised;