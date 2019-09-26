const tunnel = require("./tunnel");
const env = require("./env");
const configs = require("./configs");

const fs = require("fs");
const Sybase = require("sybase-promised");
const xml2js = require("xml2js");
const getPort = require("get-port");

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
              const args = { path, data, query, params };

              query.storage(args);
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
    username: env.SSH_REMOTE_USER,
    host: env.SSH_REMOTE_HOST,
    port: 22,
    privateKey: fs.readFileSync(env.SSH_REMOTE_PEM),
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

const run = async (xmlPath, queries) => {
  console.time("duration");

  const params = {
    agencies: [],
    queries: queries,
    keyspace: "mic",
    targetFolder: "/tmp/recorridos"
  };

  const paths = await withXML(xmlPath, _run, params);

  console.timeEnd("duration");
};

/*
 *
 * EXTRACT DATA
 *
 */
let xmlAgencies;

xmlAgencies = "/home/rooster/Descargas/agencias_v2_bimbo.xml";
// run(xmlAgencies, [configs.recorridos]);

xmlAgencies = "/home/rooster/Descargas/agencias_v2_bimbo.xml";
// run(xmlAgencies, [configs.clientes]);

xmlAgencies = "/home/rooster/Descargas/agencias_test_size_4.xml";
// run(xmlAgencies, [configs.productos_file]);
// run(xmlAgencies, [configs.productos]);

xmlAgencies = "/home/rooster/Descargas/agencias_test_size_4.xml";
run(xmlAgencies, [configs.columns]);
