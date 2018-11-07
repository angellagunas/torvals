module.exports = {
    "name": "Dataset with processing as status",
    "description": "This datasets is the input of save-dataset task",
    "uploaded" : true,
    "isDeleted" : false,
    "dateConciliated" : "2018-06-07T23:35:04.999Z",
    "dateCreated" : "2018-06-07T23:35:04.999Z",
    "periods" : [],
    "cycles" : [],
    "catalogItems" : [],
    "channels" : [],
    "products" : [],
    "salesCenters" : [],
    "groupings" : [],
    "columns" : [
        {
            "name" : "agencia_id",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : true,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : false
        },
        {
            "name" : "ajuste",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : true,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : false
        },
        {
            "name" : "canal_id",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : true,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : false
        },
        {
            "name" : "canal_nombre",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : true,
            "is_producto_id" : false,
            "is_producto_name" : false
        },
        {
            "name" : "clasificacion",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : false
        },
        {
            "name" : "fecha",
            "isDate" : true,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : false
        },
        {
            "name" : "modelo",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : false
        },
        {
            "name" : "month",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : false
        },
        {
            "name" : "prediccion",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : true,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : false
        },
        {
            "name" : "producto_id",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : true,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : true,
            "is_producto_name" : false
        },
        {
            "name" : "producto_nombre",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : true,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : true
        },
        {
            "name" : "semana_bimbo",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : false
        },
        {
            "name" : "venta",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : true,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : false
        },
        {
            "name" : "venta_uni",
            "isDate" : false,
            "isAnalysis" : true,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : false
        },
        {
            "name" : "year",
            "isDate" : false,
            "isAnalysis" : false,
            "isAdjustment" : false,
            "isPrediction" : false,
            "isSales" : false,
            "isOperationFilter" : false,
            "isAnalysisFilter" : false,
            "isProduct" : false,
            "isProductName" : false,
            "is_centro-de-venta_id" : false,
            "is_centro-de-venta_name" : false,
            "is_canal_id" : false,
            "is_canal_name" : false,
            "is_producto_id" : false,
            "is_producto_name" : false
        }
    ],
    "catalogData" : {
        "is_producto_name" : "Takis Fuego 62G Co2 Bar",
        "is_producto_id" : "123109",
        "is_canal_name" : "detalle",
        "is_canal_id" : "1",
        "is_centro-de-venta_id" : "12717"
    },
    "source" : "uploaded",
    "status" : "processing",
    "isMain" : false,
    "type" : "univariable-time-series",
    "path" : {
        "savedToDisk" : false,
        "bucket" : "abraxas-orax-statics",
        "region" : "us-east-1",
        "url" : "datasets/b12ade3e-e137-47ab-a468-cea78b9e6c9c/58f1c63d-0d24-4bdc-a649-6dad4b74da5a.csv"
    },
    "__v" : 4,
    "apiData" : {
        "products" : [
            {
                "_id" : "122928",
                "name" : "Pecositas 70P 9 8G Ric"
            },
            {
                "_id" : "123110",
                "name" : "Runners 58G Co2 Bar"
            },
            {
                "_id" : "123109",
                "name" : "Takis Fuego 62G Co2 Bar"
            }
        ],
        "salesCenters" : [
            {
                "_id" : "12837"
            },
            {
                "_id" : "12604"
            }
        ],
        "channels" : [
            {
                "_id" : "2",
                "name" : "autoservicio"
            },
            {
                "_id" : "4",
                "name" : "conveniencia"
            },
            {
                "_id" : "1",
                "name" : "detalle"
            }
        ],
        "producto" : [
            {
                "_id" : "122928",
                "name" : "Pecositas 70P 9 8G Ric"
            },
            {
                "_id" : "123110",
                "name" : "Runners 58G Co2 Bar"
            },
            {
                "_id" : "123109",
                "name" : "Takis Fuego 62G Co2 Bar"
            }
        ]
    },
    "dateMax" : "2018-05-17",
    "dateMin" : "2017-10-05"
}
