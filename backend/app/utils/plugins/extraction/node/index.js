const tunnel = require("./tunnel");
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

        return db.connect()
            .then((connection, err) => {
                if (err) return reject(err);
                const promises = [];

                for(i = 0; i<queries.lenght; i++){
                    const promise = db
                        .query(query)
                        .then(data => {
                            sqlToFile(data, path);
                            return path;
                        })
                        .catch(err => {
                            return resolve([]);
                        }).finally(()=>{
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
                    }).finally(()=>{
                        db.disconnect();
                        return resolve(results);
                    });
            })
            .catch(err => {
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
            return new Promise(async(resolve, reject) => {
                const freePort = await getPort();
                const [host, port] = agencia.serverIp[0].split(",");
                const config = getTunnelConfig(
                    host,
                    port,
                    freePort
                );
                const path = `${params.targetFolder}/${params.filePrefix}_${agencia.IdAgencia}.csv`;

                tunnel(config)
                    .then(server =>{
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
                            .finally(() => tnl.close());
                    })
                    .catch(err => {
                        console.info('error en la conexion');
                        resolve([]);
                    })

                /*.on('error', err => {
                    console.info('error en la conexion');
                    tnl.close();
                    return resolve([]);
                });*/
            });
        })

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
            params["agencies"] = xml.AGENCIAS.AGENCIA.slice(16, 18);
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
    console.time('duration');

    const params = {
        agencies: [],
        queries: ["SELECT * FROM ClienteGpsNormalizado"],
        targetFolder: "/tmp",
        filePrefix: "gps_normalizado"
    };

    const paths = await withXML(xmlPath, _run, params);

    console.info([].concat.apply([], paths));
    console.timeEnd('duration');
};


run("/home/rooster/Downloads/agencias_barcel.xml");
