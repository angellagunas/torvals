const responseToCassandra = require("./cassandra");
const sqlToFile = require("./sqlToFile");
const queries = require("./queries");

module.exports = {
    query: {
        query: queries.query(),
        filePrefix: "query_",
        targetFolder: "/tmp",
        storage: sqlToFile
    },
    rutas: {
        query: queries.rutas(),
        tableName: `rutas`,
        primaryColumns: ["codigo_agencia", "codigo_ruta"],
        storage: responseToCassandra
    },
    productos: {
        query: queries.productos(),
        tableName: `productos`,
        primaryColumns: ["codigo_producto", "codigo_barras"],
        storage: responseToCassandra
    },
    productos_file: {
        query: queries.productos(),
        filePrefix: "productos_",
        targetFolder: "/tmp",
        tableName: `prouctos`,
        primaryColumns: [],
        storage: sqlToFile
    },
    clientes: {
        query: queries.clientes(),
        tableName: `clientes`,
        primaryColumns: ["ID_CLIENTE", "ID_RUTA", "codigo_agencia"],
        storage: responseToCassandra
    },
    recorridos: {
        query: queries.recorridos("2019-08-31"),
        tableName: `recorridos`,
        primaryColumns: ["CLICOD", "codigo_agencia"],
        filePrefix: `recorridos_20190831`,
        storage: responseToCassandra
    },
    columns: {
        query: queries.columns(),
        filePrefix: "columns_",
        targetFolder: "/tmp",
        storage: sqlToFile
    },
    tables: {
        query: queries.tables(),
        filePrefix: "tables_",
        targetFolder: "/tmp",
        storage: sqlToFile
    }
};
