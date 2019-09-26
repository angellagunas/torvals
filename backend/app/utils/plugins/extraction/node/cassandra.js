const env = require("./env");

const cassandra = require("cassandra-driver");

const _getCredentials = () => {
    return new cassandra.auth.PlainTextAuthProvider(
        env.CASSANDRA_USER,
        env.CASSANDRA_PASS
    );
};

const _getOrCreateKeyspace = async keyspace => {
    /*
     * A cassandra keyspace is equivalent to database in sql.
     */
    const client = new cassandra.Client({
        localDataCenter: "datacenter1",
        contactPoints: [env.CASSANDRA_HOST],
        authProvider: _getCredentials()
    });

    await client.connect();

    const query = `
        CREATE KEYSPACE IF NOT EXISTS ${keyspace}
        WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'} 
        AND durable_writes = true
    `;

    return client
        .execute(query, [])
        .then(result => {
            return client;
        })
        .catch(err => {
            console.error("Error creating keyspace", err);
            return;
        });
};

const _getFormatedColumns = columnsName => {
    return columnsName.map(column => `${column.toLowerCase()} text`).join(",");
};

const _getOrCreateTable = async (tableName, keyspace, columnsName, keys) => {
    const client = await _getOrCreateKeyspace(keyspace);
    const columns = _getFormatedColumns(columnsName);

    const query = `
        CREATE TABLE IF NOT EXISTS ${keyspace}.${tableName} (
          ${columns},
          PRIMARY KEY (${keys.join(",")})
        );
    `;

    return client
        .execute(query)
        .then(result => {
            console.info(`Ready table ${tableName}`);
            return client;
        })
        .catch(err => {
            console.error("Error creating table", err);
            return;
        });
};

const prepareQuery = async (data, queryConf, params) => {
    if (data.length === 0) return [null, []];

    const tableName = queryConf.tableName;
    const keyspace = params.keyspace;
    const queries = [];
    const columns = Object.keys(data[0]);
    const values = columns.map(i => "?").join(",");

    const client = await _getOrCreateTable(
        tableName,
        keyspace,
        columns,
        queryConf.primaryColumns
    );

    const query = `
        INSERT INTO ${keyspace}.${tableName} 
        (${columns.map(c => c.toLowerCase()).join(",")}) VALUES (${values})
    `;

    for (register of data) {
        queries.push({
            query: query,
            params: Object.values(register).map(value => `${value}`)
        });
    }

    return [client, queries];
};

const responseToCassandra = async args => {
    const { data, query, params } = args;
    const [client, queries] = await prepareQuery(data, query, params);
    if (client === null || queries.length === 0) return;

    let promises = [];

    for (const conf of queries) {
        if (promises.length >= 2000) {
            await Promise.all(promises).catch(err => {
                console.error("Error saving bulk in cassandra", err);
            });
            promises = [];
        }

        promises.push(
            client.execute(conf.query, conf.params, { prepare: true })
        );
    }

    Promise.all(promises)
        .catch(err => {
            console.error("All promises error in responseToCassandra", err);
        })
        .finally(() => {
            client.shutdown().then(result => {
                console.info("Data saved in cassandra.");
            });
        });
};

module.exports = responseToCassandra;
