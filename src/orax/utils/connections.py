from pymongo import MongoClient

from orax.settings import DATABASES


class Mongo(object):
    """Connection to manage mongodb"""
    def __new__(self):
        try:
            client = MongoClient(
                DATABASES['mongo']['HOST'],
                DATABASES['mongo']['PORT']
            )
        except Exception as e:
            print(e)

        return client[DATABASES['mongo']['NAME']]
