"""Upload dataset on torvals from S3."""
import boto3
import io

from app.settings import AWS_ACCESS_ID, AWS_ACCESS_KEY


def download_file(path_file, target_path, bucket_name):
    """Download file from S3."""
    s3 = boto3.resource(
        's3',
        aws_access_key_id=AWS_ACCESS_ID,
        aws_secret_access_key=AWS_ACCESS_KEY
    )

    s3.Bucket(bucket_name).download_file(path_file, target_path)


def save_s3_dataframe(df, bucket_name, data_path, identifier):
    """Save DF on amazon s3."""
    # Set variable environmentes (AWS credentials)
    session = boto3.Session(
        aws_access_key_id=AWS_ACCESS_ID,
        aws_secret_access_key=AWS_ACCESS_KEY,
        region_name='us-east-1'
    )
    csv_buffer1 = io.StringIO()
    df.to_csv(csv_buffer1, index=False)
    s3_key = data_path + identifier + '.csv'
    s3_resource = session.resource('s3')
    s3_resource.Object(bucket_name, s3_key).put(Body=csv_buffer1.getvalue())
