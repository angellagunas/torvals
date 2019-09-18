const cassandra = require("cassandra-driver");

const _getOrCreateKeyspace = async keyspace => {
    /*
     * A cassandra keyspace is equivalent to database in sql.
     */
    const client = new cassandra.Client({
        localDataCenter: "datacenter1",
        contactPoints: ["127.0.0.1"]
    });

    await client.connect();

    const query = `
        CREATE KEYSPACE IF NOT EXISTS ${keyspace}
        WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'} 
        AND durable_writes = true
    `;

    return client.execute(query, []).then(result => {
        console.info(`Ready keyspace ${keyspace}`);
        return client;
    });
};

const _getFormatedColumns = columnsName => {
    return columnsName.map(column => `${column} text`).join(",");
};

const _getOrCreateTable = async (tableName, keyspace, columnsName) => {
    const client = await _getOrCreateKeyspace(keyspace);
    const columns = _getFormatedColumns(columnsName);

    const query = `
        CREATE TABLE IF NOT EXISTS ${keyspace}.${tableName} (
          ${columns},
          PRIMARY KEY (${columnsName.join(",")})
        );
    `;

    return client
        .execute(query)
        .then(result => {
            console.info(`Ready table ${tableName}`);
            return client;
        })
        .catch(err => {
            console.info(err);
            return;
        });
};

const prepareQuery = async (data, tableName, keyspace) => {
    const queries = [];
    const columns = Object.keys(data[0]);
    const values = columns.map(i => "?").join(",");

    const client = await _getOrCreateTable(tableName, keyspace, columns);

    const query = `
        INSERT INTO ${keyspace}.${tableName} 
        (${columns.join(",")}) VALUES (${values})
    `;

    for (register of data) {
        queries.push({
            query: query,
            params: Object.values(register).map(value => `${value}`)
        });
    }

    return [client, queries];
};

const responseToCassandra = async (data, table, keyspace) => {
    const [client, queries] = await prepareQuery(data, table, keyspace);
    let promises = [];

    for (query of queries) {
        if (promises.length >= 2000) {
            await Promise.all(promises);
            promises = [];
        }

        promises.push(
            client.execute(query.query, query.params, { prepare: true })
        );
    }

    Promise.all(promises)
        .then(results => {
            console.info("Termino de guardar la data en cassandra.");
        })
        .catch(err => console.info(err))
        .finally(() => {
            client.shutdown().then(result => {
                console.info("server shutdown");
                console.info("Done!");
            });
        });
};

module.exports = responseToCassandra;
