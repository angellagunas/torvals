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
};

const executeQuery = (host, port, dbName, user, pass, queries, path) => {
    const db = new Sybase({
        host: host,
        port: port,
        dbname: dbName,
        username: user,
        password: pass
    });

    db.connect().then(connection => {
        const promises = [];

        queries.forEach(query => {
            const promise = db.query(query).then(data => {
                sqlToFile(data, path);
            });

            promises.push(promise);
        });

        Promise.all(promises).then(() => {
            db.disconnect();
        });
    });
};

const getTunnelConfig = (dstHost, dstPort, localPort) => {
    return {
        username: "hadoop",
        host: "ec2-54-209-116-133.compute-1.amazonaws.com",
        port: 22,
        privateKey: fs.readFileSync("/home/al/.ssh/Dataiku.pem"),
        localHost: "127.0.0.1",
        dstHost,
        dstPort,
        localPort
    };
};

const _run = (err, params) => {
    params.agencies.forEach(agencia => {
        getPort().then(freePort => {
            const [host, port] = agencia.serverIp[0].split(",");
            const config = getTunnelConfig(host, port, freePort);
            const path = `${params.targetFolder}/${params.filePrefix}_${agencia.IdAgencia}.csv`;

            tunnel(config, (err, server) => {
                executeQuery(
                    config.localHost,
                    config.localPort,
                    agencia.sia_db,
                    agencia.sia_user,
                    agencia.sia_pwd,
                    params.queries,
                    path
                );
            });
        });
    });
};

const withXML = (path, callback, params) => {
    const parser = new xml2js.Parser({ attrkey: "ATTR" });
    const xml_string = fs.readFileSync(path, "utf8");

    return parser.parseString(xml_string, (err, xml) => {
        params["agencies"] = xml.AGENCIAS.AGENCIA;
        return callback(err, params);
    });
};

const run = xmlPath => {
    const params = {
        agencies: [],
        queries: ["SELECT * FROM ClienteGpsNormalizado"],
        targetFolder: "/tmp",
        filePrefix: "gps_normalizado"
    };
    withXML(xmlPath, _run, params);
};

run("/home/al/Descargas/agencias_rooster.xml");
