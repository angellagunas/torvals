const tunnel = require("tunnel-ssh");

const tunnelPromised = config => {
	return new Promise((resolve, reject) => {
		return tunnel(config, (err, server) => {
			if (err) return resolve(err);

			return resolve(server, err);
		});
	});
};

module.exports = tunnelPromised;
