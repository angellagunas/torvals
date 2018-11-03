from pymongo import MongoClient

from orax.settings import DATABASES


class Mongo(object):
    """Connection to manage mongodb"""
    def __new__(self):
        client = MongoClient(
            DATABASES['mongo']['HOST'],
            DATABASES['mongo']['PORT']
        )

        return client[DATABASES['mongo']['NAME']]