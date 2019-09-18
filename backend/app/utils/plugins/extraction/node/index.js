const tunnel = require("./tunnel");
const responseToCassandra = require("./cassandra");
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

const executeQuery = (host, port, dbName, user, pass, queries, path) => {
    return new Promise((resolve, reject) => {
        const db = new Sybase({
            host: host,
            port: port,
            dbname: dbName,
            username: user,
            password: pass
        });

        return db
            .connect()
            .then((connection, err) => {
                if (err) return reject(err);
                const promises = [];
                console.info("connection to bimbo DB is ready!");
                for (query of queries) {
                    const promise = db
                        .query(query.query)
                        .then(data => {
                            //sqlToFile(data, path);
                            responseToCassandra(data, query.tableName, "test");
                            return path;
                        })
                        .catch(err => {
                            console.info(
                                "error in connection to bimbo DB.",
                                err
                            );
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
                        results = value;
                    })
                    .catch(err => {
                        results = [];
                    })
                    .finally(() => {
                        db.disconnect();
                        return resolve(results);
                    });
            })
            .catch(err => {
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
        keepAlive: true,
        privateKey: fs.readFileSync("/home/rooster/.ssh/Dataiku.pem"),
        localHost: "127.0.0.1",
        dstHost,
        dstPort,
        localPort
    };
};

const _run = (err, params) => {
    return new Promise((globalResolve, globalReject) => {
        const promises = params.agencies.map(agencia => {
            return new Promise(async (resolve, reject) => {
                const freePort = await getPort();
                const [host, port] = agencia.serverIp[0].split(",");
                const config = getTunnelConfig(host, port, freePort);
                const path = `${params.targetFolder}/${params.filePrefix}_${agencia.IdAgencia}.csv`;

                tunnel(config)
                    .then((server, error) => {
                        if (error) {
                            return resolve([]);
                        }

                        executeQuery(
                            config.localHost,
                            config.localPort,
                            agencia.sia_db,
                            agencia.sia_user,
                            agencia.sia_pwd,
                            params.queries,
                            path
                        )
                            .then(path => resolve(path))
                            .catch(err => resolve([]))
                            .finally(() => server.close());
                    })
                    .catch(err => {
                        resolve([]);
                    });
            });
        });

        return Promise.all(promises)
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
            params["agencies"] = xml.AGENCIAS.AGENCIA.slice(0, 20);
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

    const params = {
        agencies: [],
        queries: [
            {
                query: "SELECT * FROM ClienteGpsNormalizado",
                tableName: "clientesNomalizado", // nombre de la tabla donde se va a guardar el resultado
                primaryColumns: ["fecha", "cliente", "producto"]
            }
        ],
        targetFolder: "/tmp",
        filePrefix: "gps_normalizado"
    };

    const paths = await withXML(xmlPath, _run, params);

    console.info([].concat.apply([], paths));
    console.timeEnd("duration");
};

run("/home/rooster/Downloads/agencias_v1_bimbo.xml");
