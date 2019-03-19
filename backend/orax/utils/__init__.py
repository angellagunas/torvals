from bson.objectid import ObjectId


def _id(data):
    """convert string to mongo ObjectId"""
    return ObjectId(data)
