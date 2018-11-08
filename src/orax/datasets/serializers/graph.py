import json

from rest_framework import serializers

from bson.objectid import ObjectId
from bson.json_util import dumps

from orax.utils.connections import Mongo



class DatasetGraphRetrieveSerializer(serializers.Serializer):
    def validate(self, data):
        return data


class DatasetGraphSerializer(serializers.Serializer):
    cycle = serializers.CharField()
    centro_de_venta = serializers.CharField()
    canal = serializers.CharField()
    prices = serializers.BooleanField(default=False)

    def validate(self, data):
        request = self.context.get('request')
        organization = request.user.get_current_org(request)
        #
        # validar que los acatalog items que manda el usuario esten en sus
        # grupos
        #
        return data

    def create(self, data):
        kwargs = self.context.get('view').kwargs
        dataset = Mongo().datasets.find_one({'uuid': kwargs.get('uuid')})
        prices = data.get('prices')
        cycle = Mongo().cycles.find_one({'uuid': data.get('cycle')})
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
            'uuid': {'$in': [
                data.get('canal'),
                data.get('centro_de_venta')
            ]}
        })

        pipeline = [
            {
                '$match': {
                    'dataset': ObjectId(dataset.get('_id')),
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

        periods = Mongo().periods.find({'cycle': ObjectId(cycle.get('_id'))})
        periods_past_season = Mongo().periods.find({
            'cycle': ObjectId(cycle_past_season.get('_id'))
        })

        try:
            indicators = json.loads(dumps(Mongo().datasetrows.aggregate(pipeline)))
        except Exception as e:
            print(e)

        data = []
        past_sales = []

        for indicator in indicators:
            for period in periods:
                if indicator.get('_id').get('$oid') == period.get('_id'):
                    indicator['period'] = [period.get('period')]
                    data.append(indicator)

        for indicator in indicators:
            for period in periods_past_season:
                if indicator.get('_id').get('$oid') == period.get('_id'):
                    indicator['period'] = [period.get('period')]
                    past_sales.append(indicator)
        
        return {
            'data': data,
            'previous': past_sales
        }
