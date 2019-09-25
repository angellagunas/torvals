const tunnel = require("./tunnel");
const responseToCassandra = require("./cassandra");
const defaultQueries = require("./queries");

const fs = require("fs");
const Sybase = require("sybase-promised");
const xml2js = require("xml2js");
const getPort = require("get-port");

const sqlToFile = (data, path) => {
    const csv = [];
    const fields = Object.keys(data[0]);
    const fileHeaders = fields.join(",");

    csv.push(fileHeaders);

    for (register of data) {
        csv.push(Object.values(register).join(","));
    }

    fs.writeFileSync(path, `${csv.join("\n")}`);
};

const executeQuery = (host, port, gency, dbN, user, pass, queries, params) => {
    return new Promise((resolve, reject) => {
        let db;
        try {
            db = new Sybase({
                host: host,
                port: port,
                dbname: dbN,
                username: user,
                password: pass
            });
        } catch (err) {
            console.error("DB error connection: ", err);
        }

        return db
            .connect()
            .then((connection, err) => {
                if (err) return reject(err);
                const promises = [];

                for (index in queries) {
                    const query = queries[index];
                    const promise = db
                        .query(query.query)
                        .then(data => {
                            const path = `${params.targetFolder}/${query.filePrefix}_${gency}.csv`;
                            sqlToFile(data, path);
                            //responseToCassandra(data, query, params);
                            return path;
                        })
                        .catch(err => {
                            console.error("Query execution error: ", err);
                            return resolve([]);
                        })
                        .finally(() => {
                            db.disconnect();
                        });

                    promises.push(promise);
                }

                let results = [];
                Promise.all(promises)
                    .then(values => {
                        results = values;
                    })
                    .catch(err => {
                        console.error("All promises in executeQuery: ", err);
                        results = [];
                    })
                    .finally(() => {
                        db.disconnect();
                        return resolve(results);
                    });
            })
            .catch(err => {
                console.error("DB error connection: ", err);
                db.disconnect();
                return reject([]);
            });
    });
};

const getTunnelConfig = (dstHost, dstPort, localPort) => {
    return {
        username: "hadoop",
        host: "ec2-54-209-116-133.compute-1.amazonaws.com",
        port: 22,
        privateKey: fs.readFileSync("/home/rooster/.ssh/Dataiku.pem"),
        localHost: "127.0.0.1",
        dstHost,
        dstPort,
        localPort
    };
};

const _run = (err, params) => {
    return new Promise(async (globalResolve, globalReject) => {
        let agencies = [];
        let cont = 1;
        const bulkSize = 9;
        // const promises = params.agencies.slice(0, 30).map(agencia => {});

        for (index in params.agencies) {
            const agencia = params.agencies[index];
            if (agencies.length >= bulkSize) {
                await Promise.all(agencies)
                    .then(result => {
                        const msg = `
              Bulk saved! --->
              ${cont * bulkSize} of ${params.agencies.length}
            `;

                        console.info(msg);
                    })
                    .catch(err => {
                        console.error("Error resolving promises in _run", err);
                    })
                    .finally(() => {
                        agencies = [];
                    });
                agencies = [];
                cont++;
            }

            agencies.push(
                new Promise(async (resolve, reject) => {
                    const freePort = await getPort();
                    const [host, port] = agencia.serverIp[0].split(",");
                    const config = getTunnelConfig(host, port, freePort);

                    const server = tunnel(config)
                        .then((server, err) => {
                            if (err) {
                                console.error(`SSH connection error: `, err);
                                return resolve([]);
                            }

                            server.on("error", err => {
                                console.error(
                                    `Error in tunnel ${agencia.nombre}-${agencia.serverIp}: `,
                                    err
                                );
                                server.close();
                                return resolve([]);
                            });

                            executeQuery(
                                config.localHost,
                                config.localPort,
                                agencia.IdAgencia,
                                agencia.sia_db,
                                agencia.sia_user,
                                agencia.sia_pwd,
                                params.queries,
                                params
                            )
                                .then(path => resolve(path))
                                .catch(err => {
                                    console.error("Error executing query", err);
                                    resolve([]);
                                })
                                .finally(() => server.close());
                        })
                        .catch(err => {
                            console.error("SSH connection error: ", err);
                            resolve([]);
                        });
                })
            );
        }

        return Promise.all(agencies)
            .then(values => {
                return globalResolve(values);
            })
            .catch(err => {
                return globalResolve([]);
            });
    });
};

const withXML = (path, callback, params) => {
    return new Promise((resolve, reject) => {
        const parser = new xml2js.Parser({ attrkey: "ATTR" });
        const xml_string = fs.readFileSync(path, "utf8");

        return parser.parseString(xml_string, (err, xml) => {
            params["agencies"] = xml.AGENCIAS.AGENCIA;
            return callback(err, params)
                .then(values => {
                    return resolve(values);
                })
                .catch(err => {
                    return resolve([]);
                });
        });
    });
};

const run = async xmlPath => {
    console.time("duration");

    const date = "2019-08-31";

    console.info(date.replace(/-/g, ""));
    const params = {
        agencies: [],
        queries: [
            {
                query: defaultQueries.queryAlma(date, date),
                tableName: `recorridos_${date.replace(/-/g, "")}`,
                primaryColumns: ["CLICOD", "codigo_agencia"],
                filePrefix: `recorridos_${date.replace(/-/g, "")}`
            }
        ],
        keyspace: "dsd",
        targetFolder: "/tmp/recorridos",
        filePrefix: "gps_normalizado"
    };

    const paths = await withXML(xmlPath, _run, params);

    console.timeEnd("duration");
};

run("/home/rooster/Descargas/agencias_r_.xml");
