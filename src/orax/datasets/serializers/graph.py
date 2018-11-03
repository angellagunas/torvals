from rest_framework import serializers

from bson.objectid import ObjectId

from orax.utils.connections import Mongo


class DatasetGraphSerializer(serializers.Serializer):
    cycle = serializers.CharField()
    centro_de_venta = serializers.CharField()
    canal = serializers.CharField()
    prices = serializers.BooleanField(default=False)

    def validate(self, data):
        print('serializers validate!!')
        request = self.context.get('request')
        organization = request.user.get_current_org(request)
        #
        # validar que los acatalog items que manda el usuario esten en sus
        # grupos
        #
        print('serializers validate endddd!!')
        return data

    def create(self, data):
        print('in creae!!!!!!!!!!!!!1')
        kwargs = self.context.get('view').kwargs
        cycle = Mongo().cycles.find_one({'uuid': data.get('cycle')})
        dataset = Mongo().datasets.find_one({'uuid': kwargs.get('uuid')})
        prices = data.get('prices')
        print('22222222222222222222')

        catalog_items = Mongo().catalogitems.find({
            'uuid': {'$in': [
                data.get('canal'),
                data.get('centro_de_venta')
            ]}
        })
        print('333333333333333')

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
                    'cycle': ObjectId(cycle.get('_id')),
                    'catalogItems': {
                        '$in': [ObjectId(item['_id']) for item in catalog_items]
                    }
                }
            }
        ]
        print('4444444444444444444444')

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

        print(pipeline)

        indicators = Mongo().datasetrows.aggregate(pipeline)

        return indicators