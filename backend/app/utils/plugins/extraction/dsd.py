"""Interface for extract data from DSD."""
import os
from datetime import datetime
from dateutil import tz
import logging

from xml.etree.ElementTree import fromstring, ElementTree

import boto3
import pandas as pd
import paramiko
import jaydebeapi
import jpype

from django.conf import settings
from app.settings import MEDIA_ROOT
from app.utils.plugins.extraction import tunnel as paramiko_tunnel
from app.utils.plugins.extraction.transfer.utils import convert
from app.utils.plugins.extraction.notifications import SlackNotifications


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(
    name=__name__,
)


class S3Transfer():
    """Manage upload to S3."""

    def __init__(self, data_frame, date, bucket, file_type='csv'):
        """Initialize class."""
        self.today = date
        self.bucket = bucket
        self.data_frame = data_frame
        self.headers = ['date_excecuted', 'date_required', 'agency_name',
                        'agency_id', 'ip_address', 'port_address', 'rows',
                        'added', 'message']
        self.metadata = pd.DataFrame(columns=self.headers)
        self.file_type = file_type

    def transfer(self, folder, file_name, meta=False):
        """Transfer the main file, or the metadata, to the given path."""
        if not meta:
            csv_buffer = convert(meta, self.file_type, self.data_frame)
        else:
            csv_buffer = convert(meta, self.file_type, self.metadata)

        # TODO: If the file exists in the bucket it will be overwritten
        session = boto3.Session(
            aws_access_key_id=settings.AWS_ACCESS_ID,
            aws_secret_access_key=settings.AWS_ACCESS_KEY
        )
        s3 = session.resource('s3')
        s3.Object(
            self.bucket,
            '{0}/{1}.{2}'.format(folder, file_name, self.file_type)
        ).put(Body=csv_buffer.getvalue(), ACL='bucket-owner-full-control')

        msg = 'File {0}.csv uploaded to {1}'.format(file_name, folder)
        logger.info(msg=msg)

    def transfer_metadada(self, type_transfer):
        """Upload metadata."""
        self.transfer(
            '{0}/.meta'.format(type_transfer),
            'META_raw_{}.csv'.format(self._fdate(self.today)),
            meta=True
        )

    def _fdate(self, date):
        return date.strftime('%Y-%m-%d')

    def add_meta(self, date_excecuted, date_required, agency_name,
                 agency_id, ip_address, port_address, rows, added, message):
        """Add a new row with the information of the execution."""
        self.metadata = self.metadata.append({
            'date_excecuted': date_excecuted,
            'date_required': date_required,
            'agency_name': agency_name,
            'agency_id': agency_id,
            'ip_address': ip_address,
            'port_address': port_address,
            'rows': rows,
            'added': added,
            'message': message
        }, ignore_index=True)


class DSDExtractor(object):
    """Execute queries in remote dsd server."""

    def __init__(self,
                 s3_bucket="abraxasiq-data",
                 s3_folder="development/torvalds/extraction",
                 s3_region="us-east-2",
                 name=""):
        """Initialize class and set default properties."""
        self.s3_bucket = s3_bucket
        self.s3_folder = s3_folder
        self.s3_region = s3_region

        self.slack = SlackNotifications(
            process=f'Torvalds Extraction {name}'
        )

    def execute_query(self, curs, query, date, **options):
        """Run the query in the remote database."""
        try:
            curs.execute(query)
            headers = [header[0] for header in curs.description]
            df = (True, pd.DataFrame(curs.fetchall(), columns=headers))
        except Exception as e:
            msg = "Error when executing the query.{0}{1}".format(query, e)
            logger.warning(msg=msg)
            df = (False, e)

        return df

    def consult(self, database, user, password, address, port, query,
                date=datetime.now(tz=tz.gettz('CST')), **options):
        """Given a ssh connection, to a remote server with access to the DB's.

        This generate a port forwarding to stablish a way to query the DB's.

        params:
            database: name of the database to query.
            user: part of the credentials to stablish the db connection.
            password: part of the credentials to stablish the db connection.
            address: IP of the remote server.
            port: port of the remote server database instance.
            query: query which will be executed in dsd.
        """
        jars = os.path.join(
            settings.BASE_DIR,
            'app/utils/plugins/extraction/drivers/jconn4.jar'
        )
        jclassname = 'com.sybase.jdbc4.jdbc.SybDriver'
        url = 'jdbc:sybase:Tds:{0}:{1}/{2}'.format(address, port, database)
        driver_args = {
            'user': user,
            'password': password
        }
        result = []

        if jpype.isJVMStarted() and not jpype.isThreadAttachedToJVM():
            jpype.attachThreadToJVM()
            jpype.java.lang.Thread.currentThread().setContextClassLoader(
                jpype.java.lang.ClassLoader.getSystemClassLoader())
        conn = jaydebeapi.connect(jclassname, url, driver_args, jars)
        curs = conn.cursor()

        result.append(self.execute_query(curs, query, date, **options))

        curs.close()
        conn.close()

        return result

    def get_agencies_info(self, client, agency, searching_date, query):
        """Create port forwarding and execute the query.

        params:
            client: object with the current connection to the bridge.
            agency: xml object, contains connection and entities information.
            searching_date: main filter to obtain information.
            query: query to execute with the tunnel created.
        """
        today = datetime.now(tz=tz.gettz('CST'))
        agency_id = agency.findtext('IdAgencia')
        agency_name = agency.findtext('nombre')
        division = agency.findtext('division')
        region = agency.findtext('region')
        database = agency.findtext('sia_db')
        user = agency.findtext('sia_user')
        password = agency.findtext('sia_pwd')
        tunnel_data = agency.findtext('serverIp').split(',')
        tunnel_host = tunnel_data[0]
        tunnel_port = int(tunnel_data[1])
        metainfo = [today, searching_date.strftime("%Y-%m-%d"), agency_name,
                    agency_id, tunnel_host, tunnel_port]
        try:
            with paramiko_tunnel.Tunnel(
                paramiko_session=client,
                remote_host=tunnel_host,
                remote_port=tunnel_port
            ) as tunnel:
                results = self.consult(
                    database,
                    user,
                    password,
                    tunnel.bind_address,
                    tunnel.bind_port,
                    query,
                    searching_date,
                    agency_id=agency_id,
                    agency_name=agency_name,
                    division=division,
                    region=region
                )
        except Exception as e:
            msg = 'Exception connecting to tunnel. {}'.format(e)
            logger.warning(msg=msg)

            return (str(e), metainfo)

        logger.info(msg='Done with agency {}'.format(agency_id))
        return (results, metainfo)

    def rows_to_columns(self, result):
        """Convert array in columns.

        Given an array of results, one for each agency, with each element
        having one or more responses of the queries, we group by each one in
        the same element, and split the metainformation.
        """
        meta = []
        transfer = []
        for item in result:
            if isinstance(item[0], str):
                # TODO: Report the error, add the meta information too.
                logger.info('IS STRING! Add this line to the META file')
                transfer.append([])
                meta.append(
                    ['The connection have an error and can not continue.']
                )
                continue
            for count, scale in enumerate(item[0]):
                if len(transfer) <= count:
                    transfer.append([])
                    meta.append([])
                if scale[0]:
                    transfer[count].append(scale[1])
                    metainfo = item[1] + [len(scale[1]), 1, 'ok']
                else:
                    metainfo = item[1] + [0, 0, scale[1]]
                meta[count].append(metainfo)
        return meta, transfer

    def _main(self, xml_config, searching_date, query, name):
        """Main function that runs each step to extract the requiered information.

        params:
            xml_config (string): valid xml with the info for the conections.
            searching_date (string): variable to filter the query by date.
            query (string): query which will be execute in dsd.
        """
        key = paramiko.RSAKey.from_private_key_file(settings.SSH_REMOTE_PEM)

        self.slack.slack_messages(stage=1)
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        client.connect(
            hostname=settings.SSH_REMOTE_HOST,
            username=settings.SSH_REMOTE_USER,
            port=settings.SSH_REMOTE_PORT,
            pkey=key
        )

        tree = ElementTree(fromstring(xml_config))
        root = tree.getroot()
        tree_len = len(root.findall('AGENCIA'))
        self.slack.slack_messages(stage=2, connections=tree_len)

        result = []
        for index, agency in enumerate(root.findall('AGENCIA')):
            result.append(
                self.get_agencies_info(client, agency, searching_date, query)
            )
            self.slack.slack_messages(stage=2, current=index)

        self.slack.slack_messages(stage=3)
        meta, transfer = self.rows_to_columns(result)

        for count, item in enumerate(transfer):
            transfer_df = pd.concat(item, ignore_index=True)

            file_name_local = '{0}/{1}.csv'.format(MEDIA_ROOT, name)

            transfer_df.to_csv(file_name_local, sep='|')

            #transfer_obj = S3Transfer(
            #    data_frame=transfer_df,
            #    date=searching_date,
            #    bucket=self.s3_bucket
            #)

            #for element in meta[count]:
            #    transfer_obj.add_meta(*element)

            #transfer_obj.transfer(
            #    self.s3_folder,
            #    file_name=name
            #)
            #transfer_obj.transfer_metadada(self.s3_folder)

        client.close()
        self.slack.slack_messages(stage=4)

    def extract(self, xml_config, query, name, slack_channel='CFAPTFH1S',
                date=datetime.now(tz=tz.gettz('CST'))):
        """Main function to run the extraction.

        params:
            xml_config (string): xml with credentials, address.
            query (string): query which should be execute in dsd.
            date (string YYYY-MM-DD): param in query.
            slack_channel (string): slack channel where will be notified.
        """
        # Determine the dates.
        if not isinstance(date, datetime):
            look_date = datetime.strptime(date, '%Y-%m-%d')
        else:
            look_date = date

        self.slack.channel = slack_channel
        self.slack.slack_messages(stage=0)

        self._main(xml_config, look_date, query, name)
