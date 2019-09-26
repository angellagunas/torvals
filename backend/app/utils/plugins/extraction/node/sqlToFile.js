const fs = require("fs");

const sqlToFile = args => {
	const { data, path } = args;
	const csv = [];
	const fields = Object.keys(data[0]);
	const fileHeaders = fields.join(",");

	csv.push(fileHeaders);

	for (register of data) {
		csv.push(Object.values(register).join(","));
	}

	fs.writeFileSync(path, `${csv.join("\n")}`);
};

module.exports = sqlToFile;
