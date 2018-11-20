import json
import threading

from bson.json_util import dumps

from orax.utils import _id
from orax.utils.connections import MongoCollection
from orax.utils.cache import Cache


class DatasetUtils(MongoCollection):
    def get_indicators(
            self, dataset_uuid, cycle_uuid,
            channel_uuid, sale_center_uuid, prices=False):
        """
        Calculate the indicators (sum or sum/multiply) by each case
        (period, channel, sale_center).

        parameters:
          - dataset_uuid: the active adjustment dataset
          - cycle_uuid: the cycle to make the indicators
          - channel_uuid: catalog item with channel as type
          - sale_center_uuid: catalog item with centro-de-ventas as type
          - prices: if is True then multiply each row by its prices
        """

        dataset = self.db.datasets.find_one({'uuid': dataset_uuid})
        project = self.db.projects.find_one({
            '_id': _id(dataset['project'])
        })
        cycle = self.db.cycles.find_one({'uuid': cycle_uuid})
        cycle_year = cycle['dateStart'].year - 1
        cycle_past_season = list(self.db.cycles.aggregate([
            {"$redact": {
                "$cond": [
                    {"$and": [
                        {"$eq": ["$rule", _id(cycle['rule'])]},
                        {"$eq": [{"$year": "$dateStart"}, cycle_year]},
                        {"$eq": ["$cycle", int(cycle['cycle'])]}
                    ]},
                    "$$KEEP",
                    "$$PRUNE"
                ]
            }}
        ]))

        cycle_past_season = cycle_past_season[0] if len(cycle_past_season) > 0 else  None

        cycles = [_id(cycle['_id'])]

        if cycle_past_season is not None:
            cycles.append(_id(cycle_past_season['_id']))

        catalog_items = self.db.catalogitems.find({
            'uuid': {'$in': [channel_uuid, sale_center_uuid]}
        })

        pipeline = [
            {
                '$match': {
                    'dataset': {
                        '$in': [
                            _id(dataset['_id']),
                            _id(project['mainDataset'])
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
                        '$in': cycles,
                    },
                    'catalogItems': {
                        '$in': [_id(item['_id']) for item in catalog_items]
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
            self.db.periods.find({'cycle': _id(cycle['_id'])})
        )

        periods_past_season = []
        if cycle_past_season is not None:
            periods_past_season = list(
                self.db.periods.find({
                    'cycle': _id(cycle_past_season['_id'])
                })
            )

        try:
            indicators = json.loads(dumps(self.db.datasetrows.aggregate(pipeline)))
        except Exception as e:
            print(e)

        data = []
        past_sales = []

        for indicator in indicators:
            for period in periods:
                if indicator['_id']['$oid'] == str(period['_id']):
                    indicator['period'] = [period['period']]
                    data.append(indicator)

        for indicator in indicators:
            for period in periods_past_season:
                if indicator['_id']['$oid'] == str(period['_id']):
                    indicator['period'] = [period['period']]
                    past_sales.append(indicator)
        
        return {
            'data': data,
            'previous': past_sales
        }

    def _full_indicators(self, project_uuid, cycle_uuid, prices):
        """
        Calculate all indicators for an specific project and set it to cache.

        parameters:
          - project_uuid: the project from which will be calculate the
            indicators.
          - cycle_uuid: cycle which group the periods which will be calculate.
          - prices: define if the indicators should be calculated taking the
            prices
        """
        project = self.db.projects.find_one({'uuid': project_uuid})

        active_dataset = self.db.datasets.find_one({
            '_id': _id(project['activeDataset'])
        },{
            'uuid': 1
        })

        channels = self.db.catalogitems.find({
            'organization': _id(project['organization']),
            'isDeleted': False,
            'type': 'canal'
        }, {
            'uuid': 1,
            'name': 1
        })

        sale_centers = self.db.catalogitems.find({
            'organization': _id(project['organization']),
            'isDeleted': False,
            'type': 'centro-de-venta'
        }, {
            'uuid': 1,
            'name': 1
        })

        key = "uuid::{0}:cycle::{1}:centro-de-venta::{2}:canal::{3}:prices::{4}:"

        for channel in channels:
            for sale_center in sale_centers:
                cache_key = key.format(
                    active_dataset['uuid'],
                    cycle_uuid,
                    sale_center['uuid'],
                    channel['uuid'],
                    prices
                )

                msg = key.format(
                    active_dataset['uuid'],
                    cycle_uuid,
                    sale_center['name'],
                    channel['name'],
                    prices
                )
                print('calculating value for: {0}'.format(msg))

                indicators = self.get_indicators(
                    active_dataset['uuid'],
                    cycle_uuid,
                    channel['uuid'],
                    sale_center['uuid'],
                    prices
                )

                Cache.set(cache_key, indicators)

    def calculate_indicadors_by_project(self, project_uuid, cycle_uuid):
        """
        Calculate all indicators for an specific project and set it to cache.

        parameters:
          - project_uuid: the project from which will be calculate the
            indicators.
          - cycle_uuid: cycle which group the periods which will be calculate.
        """
        print('Calculating indicatores WITHOUT prices')
        self._full_indicators(project_uuid, cycle_uuid, False)

        print('Calculating indicatores WITH prices')
        self._full_indicators(project_uuid, cycle_uuid, True)

    def run_async(self, project_uuid, cycle_uuid):
        function = self.calculate_indicadors_by_project()
        t = threading.Thread(
            name='calculatin cache',
            target=function,
            args=(project_uuid, cycle_uuid)
        )
        t.start()
