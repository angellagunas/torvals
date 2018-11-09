import json

from bson.objectid import ObjectId
from bson.json_util import dumps

from orax.utils.connections import Mongo


class DatasetUtils(object):
    @classmethod
    def get_indicators(
            self, dataset_uuid, cycle_uuid,
            channel_uuid, sale_center_uuid, prices=False):

        dataset = Mongo().datasets.find_one({'uuid': dataset_uuid})
        project = Mongo().projects.find_one({
            '_id': ObjectId(dataset.get('project'))
        })
        cycle = Mongo().cycles.find_one({'uuid': cycle_uuid})
        cycle_year = cycle.get('dateStart').year
        cycle_past_season = list(Mongo().cycles.aggregate([
            {"$redact": {
                "$cond": [
                    {"$and": [
                        {"$eq": ["$rule", ObjectId(cycle.get('rule'))]},
                        {"$eq": [{"$year": "$dateStart"}, int(cycle_year - 1)]},
                        {"$eq": ["$cycle", int(cycle.get('cycle'))]}
                    ]},
                    "$$KEEP",
                    "$$PRUNE"
                ]
            }}
        ]))[0]

        catalog_items = Mongo().catalogitems.find({
            'uuid': {'$in': [channel_uuid, sale_center_uuid]}
        })

        pipeline = [
            {
                '$match': {
                    'dataset': {
                        '$in': [
                            ObjectId(dataset.get('_id')),
                            ObjectId(project.get('mainDataset'))
                        ]
                    },
                    'isDeleted': False,
                    'data.adjustment': {
                        '$ne': None
                    },
                    'data.prediction': {
                        '$ne': None
                    },
                    'cycle': {
                        '$in': [
                            ObjectId(cycle.get('_id')),
                            ObjectId(cycle_past_season.get('_id'))
                        ]
                    },
                    'catalogItems': {
                        '$in': [ObjectId(item['_id']) for item in catalog_items]
                    }
                }
            }
        ]

        if prices:
            pipeline = pipeline + [
                {
                    '$lookup': {
                        'from': 'prices',
                        'localField': 'newProduct',
                        'foreignField': 'product',
                        'as': 'prices'
                    }
                },
                {
                    '$unwind': {
                        'path': '$prices'
                    }
                },
                {
                    '$match': {
                        'prices.isDeleted': False
                    }
                },
                {
                    '$redact': {
                        '$cond': [
                            {
                                '$setIsSubset': [
                                    '$prices.catalogItems',
                                    '$catalogItems'
                                ]
                            },
                            '$$KEEP',
                            '$$PRUNE'
                        ]
                    }
                }
            ]

        pipeline = pipeline + [
            {
                '$group': {
                    '_id': '$period',
                    'prediction': {
                        '$sum': { '$multiply': ['$data.prediction', '$prices.price'] } if prices else '$data.prediction'
                    },
                    'adjustment': {
                        '$sum': { '$multiply': ['$data.adjustment', '$prices.price'] } if prices else '$data.adjustment'
                    },
                    'sale': {
                        '$sum': { '$multiply': ['$data.sale', '$prices.price'] } if prices else '$data.sale'
                    }
                }
            },
            {
                '$project': {
                    'period': '$_id',
                    'prediction': 1,
                    'adjustment': 1,
                    'sale': 1
                }
            },
            {
                '$sort': {
                    'period': 1
                }
            }
        ]

        periods = list(
            Mongo().periods.find({'cycle': ObjectId(cycle.get('_id'))})
        )
        periods_past_season = list(
            Mongo().periods.find({
                'cycle': ObjectId(cycle_past_season.get('_id'))
            })
        )

        try:
            indicators = json.loads(dumps(Mongo().datasetrows.aggregate(pipeline)))
        except Exception as e:
            print(e)

        data = []
        past_sales = []

        for indicator in indicators:
            for period in periods:
                if indicator.get('_id').get('$oid') == str(period.get('_id')):
                    indicator['period'] = [period.get('period')]
                    data.append(indicator)

        for indicator in indicators:
            for period in periods_past_season:
                if indicator.get('_id').get('$oid') == str(period.get('_id')):
                    indicator['period'] = [period.get('period')]
                    past_sales.append(indicator)
        
        return {
            'data': data,
            'previous': past_sales
        }