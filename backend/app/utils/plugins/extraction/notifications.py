from datetime import datetime, timedelta
import logging

import slack
from django.conf import settings

logger = logging.getLogger(
    name=__name__,
)


class SlackNotifications():
    def __init__(self, process='Torvalds Extraction', channel='CFAPTFH1S'):
        self.client = slack.WebClient(token=settings.SLACKBOT_TOKEN)
        try:
            self.client.api_test()
        except Exception as e:
            logger.warning(msg='Invalid Slack bot token.')
            self.client = None
        self.response = None
        self.channel = channel
        self.process = process
        self.message = Message(process=process)

    def slack_messages(self, stage=0, connections=None, current=None):
        '''Form the message given the stage of the process.

        stage -- the main variable to identify the current phase.
        connections -- number of connections expected.
        current -- number of the connection in execution.
        '''
        if connections:
            self.message.connections = connections
        if current:
            self.message.current = current
        main_message = self.message.main_message()
        stages = {
            'remote': ['waiting', 'loading', 'ready', 'ready', 'ready'],
            'connections': ['waiting', 'waiting', 'loading', 'ready', 'ready'],
            'saving': ['waiting', 'waiting', 'waiting', 'loading', 'ready']
        }
        attachments = [
            self.message.remote_message(stages['remote'][stage]),
            self.message.connections_message(stages['connections'][stage]),
            self.message.saving_message(stages['saving'][stage])
        ]
        self.send_message(main_message, attachments)

    def send_message(self, main_message, attachments):
        '''Main function to send the message with the needed variables.
        If the client is missing it will exit before doing any process.

        main_message -- construction for the main message.
        attachments -- secondary part of the message, this will be hidden
                       in some applications.
        '''
        if not self.client:
            logger.warning(msg='Failed to send message.')
            return

        content = {
            'ts': self.response['ts'] if self.response else None,
            'channel': self.channel,
            'text': 'Arkon Automatic Information System',
            'blocks': [
                main_message, {
                    'type': 'divider'
                }
            ],
            'attachments': attachments
        }
        if self.response:
            self.response = self.client.chat_update(**content)
            logger.info(msg='Chat message updated.')
        else:
            self.response = self.client.chat_postMessage(**content)
            logger.warning(msg='New chat message sended.')


class Message:
    def __init__(self, process):
        self.process = process
        self.connections = 0
        self.current = 0
        self.waiting_tag = {
            'color': '#FFB036',
            'icon': '🤖'
        }
        self.loading_tag = {
            'color': '#6891E3',
            'icon': ('https://stage.arkondata.com/',
                     'static/media/arkon_loader.d74d22bf.gif'),
        }
        self.ready_tag = {
            'color': '#2BC4C1',
            'icon': '✓'
        }
        self.today = self.timeround30(datetime.today())

    def timeround30(self, dt):
        '''Round down a given date to the neares 30 minute interval.'''
        delta = timedelta(minutes=30)
        new_dt = (dt - (dt - datetime.max) % delta) + timedelta(microseconds=1)
        minutes = new_dt.strftime("%-M")
        return f'{new_dt.strftime("%-I")}{minutes if minutes != "0" else ""}'

    def main_message(self):
        '''Construct the main block of information.'''
        return {
            'type': 'section',
            'text': {
                'type': 'mrkdwn',
                'text': (
                    (f':clock{self.today}: '
                     f'Ejecutando consultas para *{self.process}*')
                ),
            }
        }

    def remote_message(self, status='waiting'):
        response = {
            'color': self.waiting_tag['color'],
            'fallback': 'Conectando con el servidor remoto',
            'author_name': f'{self.waiting_tag["icon"]} Conexión ssh pendiente'
        }
        if status == 'loading':
            response = {
                'color': self.loading_tag['color'],
                'fallback': 'Conectando con el servidor remoto',
                'author_icon': self.loading_tag['icon'],
                'author_name': f'Conexión ssh pendiente'
            }
        elif status == 'ready':
            response = {
                'color': self.ready_tag['color'],
                'fallback': 'Conectado con el servidor remoto',
                'author_name': (f'{self.ready_tag["icon"]} '
                                f'Conectado con el servidor remoto'),
            }
        return response

    def connections_message(self, status='waiting'):
        response = {
            'color': self.waiting_tag['color'],
            'fallback': 'Esperando por la conexión',
            'author_name': (f'{self.waiting_tag["icon"]} '
                            'Conexiones remotas pendientes')
        }
        if status == 'loading':
            response = {
                'color': self.loading_tag['color'],
                'fallback': 'Ejecutando consultas',
                'author_icon': self.loading_tag['icon'],
                'author_name': (f'Ejecutando {self.current + 1} '
                                f'de {self.connections}')
            }
        elif status == 'ready':
            response = {
                'color': self.ready_tag['color'],
                'fallback': 'Ejecutando consultas',
                'author_name': (f'{self.ready_tag["icon"]} {self.connections} '
                                f'consultas ejecutadas')
            }
        return response

    def saving_message(self, status='waiting'):
        response = {
            'color': self.waiting_tag['color'],
            'fallback': 'Reporte pendiente',
            'author_name': f'{self.waiting_tag["icon"]} Reporte pendiente'
        }
        if status == 'loading':
            response = {
                'color': self.loading_tag['color'],
                'fallback': 'Reporte pendiente',
                'author_icon': self.loading_tag['icon'],
                'author_name': f'Guardando la información.'
            }
        elif status == 'ready':
            response = {
                'color': self.ready_tag['color'],
                'fallback': 'Reporte listo',
                'author_name': (f'{self.ready_tag["icon"]} '
                                f'Información guardada'),
                'text': 'La información ya está disponible'
            }
        return response
