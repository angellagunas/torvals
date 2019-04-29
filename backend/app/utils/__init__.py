import pandas as pd


def get_csv_columns(path):
    """Return the column headers of given csv."""
    csv_file = pd.read_csv(path)
    return list(csv_file.columns)
