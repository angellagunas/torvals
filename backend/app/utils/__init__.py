from bson.objectid import ObjectId

import pandas as pd


def _id(data):
    """convert string to mongo ObjectId"""
    return ObjectId(data)


def get_csv_columns(path):
    """Return the column headers of given csv."""
    csv_file = pd.read_csv(path)
    return list(csv_file.columns)
