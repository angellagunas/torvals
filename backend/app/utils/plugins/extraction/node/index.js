var tunnel = require("tunnel-ssh");
var fs = require("fs");
const Sybase = require("sybase-promised");
var xml2js = require("xml2js");
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

    return path;
};

const executeQuery = (host, port, dbName, user, pass, queries, path) => {
    return new Promise((resolveGlobal, reject) => {
        const db = new Sybase({
            host: host,
            port: port,
            dbname: dbName,
            username: user,
            password: pass
        });

        db.connect()
            .then((connection, err) => {
                if (err) return resolveGlobal(err);
                const promises = [];

                queries.forEach(query => {
                    const promise = db
                        .query(query)
                        .then(data => {
                            return sqlToFile(data, path);
                        })
                        .catch(err => {
                            return [];
                        });

                    promises.push(promise);
                });

                Promise.all(promises)
                    .then(values => {
                        db.disconnect();
                        console.info('--------------------')
                        console.info(values);
                        return resolveGlobal(values);
                    })
                    .catch(err => {
                        db.disconnect();
                        return resolveGlobal([]);
                    });
            })
            .catch(err => {
                return resolveGlobal([]);
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
    return new Promise((resolve, reject) => {
        const promises = [];

        params.agencies.forEach(agencia => {
            promises.push(
                new Promise((resolve, reject) => {
                    getPort()
                        .then(freePort => {
                            const [host, port] = agencia.serverIp[0].split(",");
                            const config = getTunnelConfig(
                                host,
                                port,
                                freePort
                            );
                            const path = `${params.targetFolder}/${params.filePrefix}_${agencia.IdAgencia}.csv`;

                            tunnel(config, async(err, server) => {
                                const paths = await executeQuery(
                                    config.localHost,
                                    config.localPort,
                                    agencia.sia_db,
                                    agencia.sia_user,
                                    agencia.sia_pwd,
                                    params.queries,
                                    path
                                )

                                console.info('------------------>', paths);
                                return resolve([]);
                            }).on('error', (err)=>{
                                console.info('ERROR with connection.');
                                return resolve([]);
                            });
                        })
                        .catch(err => {
                            console.info('me lleva la verga!')
                            return resolve([]);
                        });
                })
            );
        });

        Promise.all(promises)
            .then(values => {
                console.info('fuck i hate u......................................');
                return resolve(values);
            })
            .catch(err => {
                console.info(err)
                console.info('fuck i hate u, in catch......................................');
                resolve([]);
            });
    });
};

const withXML = (path, callback, params) => {
    return new Promise((resolve, reject) => {
        const parser = new xml2js.Parser({ attrkey: "ATTR" });
        const xml_string = fs.readFileSync(path, "utf8");

        return parser.parseString(xml_string, (err, xml) => {
            params["agencies"] = xml.AGENCIAS.AGENCIA.slice(0, 100);
            callback(err, params)
                .then(values => {
                    console.info('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1');
                    return resolve(values);
                })
                .catch(err => {
                    console.info('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa2');
                    return resolve([]);
                });
        });
    });
};

const run = async xmlPath => {
    console.time('EXTRACTING SCRIPT');
    const params = {
        agencies: [],
        queries: ["SELECT * FROM ClienteGpsNormalizado"],
        targetFolder: "/tmp",
        filePrefix: "gps_normalizado"
    };

    withXML(xmlPath, _run, params).then((paths)=>{
        console.info('worale')
        console.info([].concat.apply([], paths));
    }).catch(err =>{
        'valio verga'
    })

};

run("/home/rooster/Downloads/agencias_barcel.xml");
