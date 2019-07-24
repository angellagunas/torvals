from io import StringIO, BytesIO

import pyarrow as pa
import pyarrow.parquet as pq


def convert(self, file_type, df):
    '''Convert a DataFrame to an appropieate type to be saved.

    Currently supported CSV and Parquet.
    '''
    csv_buffer = StringIO()
    if file_type == 'csv':
        df.to_csv(csv_buffer, sep='|', index=False)
    elif file_type == 'parquet':
        csv_buffer = BytesIO()
        table = pa.Table.from_pandas(df)
        pq.write_table(table, csv_buffer)
    return csv_buffer
