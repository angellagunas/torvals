"""Define utilities specifics for each project."""
# flake8: noqa
from io import StringIO

import pandas as pd
import numpy as np
import glob
import os
import logging

import boto3

from datetime import datetime

from django.core.mail import EmailMessage

from app.datasets.models import Dataset, DatasetRow
from app.projects.models import Project
from app.settings import AWS_ACCESS_ID, AWS_ACCESS_KEY
from app.users.models import User
from app.utils.s3 import download_file, save_s3_dataframe
from app.utils.tasks import send_slack_notifications

logging.basicConfig(format='%(asctime)-15s %(message)s', level=20)
logger = logging.getLogger(__name__)


class BarcelUtils(object):
    """Utils for Barcel."""

    def send_order_to_dispatcher(self, dispatcher_email, receivers):
        """Send report without adjustments."""
        csv_file = StringIO()
        user = User.objects.get(email=dispatcher_email)

        dataset = Dataset.objects.get(
            is_main=True,
            project=user.project,
            type__slug='pedidos'
        )

        row = DatasetRow.objects.filter(
            dataset=dataset, is_active=True
        ).last()

        sales_centers = user.sale_center.all()
        date_adjustment_label = dataset.date_adjustment
        str_date = date_adjustment_label.strftime('%d_de_%m_del_%Y')

        filters = {
            'sale_center__in': sales_centers,
            'is_active': True
        }

        columns = [
            'Categoria',
            'ExisR_corr',
            'Transito_corr_(Qty)',
            'pol_inv_corr',
            'sugerido_corrugados',
            'pedido_final',
            'sugerido_camas',
            'sugerido_tarimas'
        ]
        dataset.to_web_csv(csv_file, filters, columns)

        ceves_id = '_'.join([sc.external_id for sc in sales_centers])
        ceves_name = '_'.join([sc.name for sc in sales_centers])

        subject = "Pedido sugerido - {0} - {1}".format(
            ceves_name,
            ceves_id
        )

        msg = EmailMessage(
            subject=subject,
            body=subject,
            from_email='contact@abraxasintelligence.com',
            to=[dispatcher_email],
            cc=receivers
        )

        file_name = 'order_ceve_{0}_{1}.csv'.format(
            ceves_id,
            str_date
        )
        msg.content_subtype = "html"
        msg.attach(
            file_name,
            csv_file.getvalue(),
            'text/csv'
        )
        msg.send()


class GloboUtils(object):
    """Utitlities specific for elGlobo project."""

    current_dir = '/tmp'

    def _path(self, relative_path):
        return "{0}/{1}".format(self.current_dir, relative_path)

    def _getlatest(self):
        """Obtains latest file name from forecasts."""
        list_of_files = glob.glob(self._path('forecasts/*'))
        latest_file = max(list_of_files, key=os.path.getctime)
        return(latest_file)

    def buildbom(self, debug=False):
        """
        Cleans and prepares necesary components. Can be done away with if data is
        already standardized into same formats and column names beforehand.
        > Inputs:
        * proporciones: Ratios of materials required for SKUs
        * llaves_componentes: Material descriptions and id for isla / sucursal
        * forecast: Vanilla forecast derived from Orax Forecast
        * cat_sucursales: Catalogue for joining venue format to forecast
        * calendario: The actual shipment dates for 2019
        > Intermediates:
        * componentes: Joint bom-cat_componentes dataframe
        * forecast_suc: Joint forecast-cat_sucursales dataframe
        * calendario: Formated shipments calendar
        > Output:
        * BoM: Full Bill of Materials by dates and all. Required for buildorders()
        """
        # Data prep BoM from proporciones, llaves_componentes
        proporciones = pd.read_csv(
            self._path('catalogues/proporciones.csv'),
            dtype=str
        )
        proporciones.cant_base = proporciones.cant_base.astype(float)
        llaves_componentes = pd.read_csv(
            self._path('catalogues/catalogo_componentes.csv'),
            encoding='latin-1',
            dtype=str
        )
        componentes = proporciones.merge(right=llaves_componentes, how='left',
                                         on='componente_id')
        # Data prep forecast with sucursales.formato
        forecast_filename = self._getlatest()
        forecast = pd.read_csv(forecast_filename,
                               usecols=['sucursal_id', 'producto_id',
                                        'fecha', 'prediccion', 'semana_bimbo'],
                               dtype=str)
        forecast.fecha = pd.to_datetime(forecast.fecha, format='%Y-%m-%d')
        forecast.prediccion = pd.to_numeric(forecast.prediccion)
        cat_sucursales = pd.read_csv(
            self._path('catalogues/catalogo_sucursales.csv'),
            usecols=['NEGOCIO', 'NOMBRE', 'FORMATO'],
            encoding='latin-1',
            dtype=str
        )
        cat_sucursales.columns = ['sucursal_id', 'sucursal_nombre', 'formato']
        forecast_suc = forecast.merge(right=cat_sucursales[['sucursal_id',
                                                            'formato']], how='left', on=['sucursal_id'])
        # Data prep calendar with sucursales.formato as ell
        calendario = pd.read_csv(
            self._path('catalogues/calendarios.csv'),
            usecols=[
                'sucursal_id',
                'semana_bimbo',
                'fecha',
                'dia',
                'componente_tipo'
            ],
            encoding='latin-1',
            dtype=str
        )
        calendario.fecha = pd.to_datetime(calendario.fecha)
        # Add format column to calendar
        calendario = calendario.merge(right=cat_sucursales[['sucursal_id',
                                                            'formato']], how='left', on=['sucursal_id'])
        """JOINS AND FILLS"""
        # Join forecast with component catalogue
        forecast_exp = forecast_suc.merge(right=componentes, how='left',
                                          on=['producto_id', 'formato'])
        forecast_exp = forecast_exp.drop('componente_nombre', axis=1)
        # For producto terminado, fill column with a default 1 for calculation
        forecast_exp['cant_base'] = np.where(forecast_exp.cant_base.isnull(),
                                             1, forecast_exp.cant_base)
        # For producto terminado, fill empty columns for product id and type
        forecast_exp['componente_id'] = np.where(forecast_exp.componente_id.isnull(),
                                                 forecast_exp.producto_id,
                                                 forecast_exp.componente_id)
        forecast_exp['componente_tipo'] = np.where(forecast_exp.componente_tipo.isnull(),
                                                   'PT', forecast_exp.componente_tipo)
        # Calculate the total amount of materials required by each product
        forecast_exp['cant_exp'] = forecast_exp.prediccion * forecast_exp.cant_base
        # In cases where null, fill with original prediction (producto terminado)
        forecast_exp['cant_exp'] = np.where(forecast_exp.cant_exp.isnull(),
                                            forecast_exp.prediccion,
                                            forecast_exp.cant_exp)
        # Join the calculated materials with the shipment dates they're required on
        explosionado = forecast_exp.merge(right=calendario,
                                          how='left',
                                          on=['sucursal_id', 'componente_tipo',
                                              'fecha', 'semana_bimbo', 'formato'])
        # DO NOT CHANGE: this sort makes fillna work
        explosionado = explosionado.sort_values(['componente_id',
                                                 'sucursal_id',
                                                 'producto_id',
                                                 'componente_tipo',
                                                 'formato',
                                                 'fecha',
                                                 'dia'])

        # Business logic: duplicate fridays to compensate for blind value (orders on final wednesdays)
        explosionado.cant_exp = explosionado.apply((lambda x: x.cant_exp * 2
                                                    if x.dia == 'Wednesday'
                                                    else x.cant_exp), axis=1)
        # MOST IMPORTANT LINE IN CODE: Creates common key for grouping
        explosionado['dia_entrega'] = explosionado.dia.fillna(method='ffill')
        # Group by weekday and week, excluding product_id (important)
        consolidado = explosionado.groupby(['sucursal_id', 'componente_id',
                                            'semana_bimbo', 'componente_tipo',
                                            'producto_id', 'formato',
                                            'dia_entrega'])[["prediccion",
                                                             "cant_exp"]].sum()
        consolidado = consolidado.reset_index()
        # Re-join grouped consolidado with detailed explosionado for actual dates
        bom_uf = consolidado.merge(right=explosionado, how='left',
                                   left_on=['sucursal_id', 'componente_id',
                                            'semana_bimbo', 'componente_tipo',
                                            'producto_id', 'dia_entrega',
                                            'formato'],
                                   right_on=['sucursal_id', 'componente_id',
                                             'semana_bimbo', 'componente_tipo',
                                             'producto_id', 'dia', 'formato'])
        """RECONSTRUCTED VALUES AND NAMES"""
        bom_uf['in_calendar'] = bom_uf.sucursal_id.isin(calendario.sucursal_id)
        bom_uf = bom_uf[bom_uf.in_calendar]
        bom_uf = bom_uf.drop('in_calendar', axis=1)
        # Remove lines for categories not in calendar (IN and TC)
        bom_uf['in_category'] = bom_uf.componente_tipo.isin(calendario.componente_tipo)
        bom_uf = bom_uf[bom_uf.in_category]
        bom_uf = bom_uf.drop('in_category', axis=1)
        # Reconstruct unfiltered with values from explosionado
        bom_uf['fecha'] = bom_uf.fecha.fillna(method='ffill')
        bom_uf['prediccion_acumulada'] = bom_uf.prediccion_x
        bom_uf['cantidad_explosionada'] = bom_uf.cant_exp_x
        bom_uf['dia_entrega'] = bom_uf.dia_entrega_x
        bom_uf = bom_uf.sort_values(['sucursal_id', 'componente_id',
                                     'fecha', 'componente_tipo',
                                     'producto_id'])

        # Merge for missing names: venue, product, component
        productos = pd.read_csv(
            self._path('catalogues/catalogo_productos.csv'),
            encoding='latin-1',
            names=[
                'producto_id',
                'producto_nombre',
                'producto_categoria']
            )
        bom_uf = bom_uf.merge(right=cat_sucursales[['sucursal_id',
                                                    'sucursal_nombre']], how='left', on=['sucursal_id'])
        bom_uf = bom_uf.drop('cant_base', axis=1)
        bom_uf = bom_uf.merge(right=componentes[['producto_id',
                                                 'componente_id',
                                                 'componente_nombre',
                                                 'formato', 'cant_base']],
                              how='left', on=['producto_id',
                                              'componente_id',
                                              'formato'])
        bom_uf['cant_base'] = np.where(bom_uf.cant_base.isnull(),
                                       1, bom_uf.cant_base)
        bom_uf = bom_uf.merge(right=productos, on=['producto_id'])
        # Select bom_uf columns
        bom = bom_uf[['sucursal_id', 'sucursal_nombre', 'formato',
                      'producto_id', 'producto_nombre', 'producto_categoria',
                      'componente_id', 'componente_nombre', 'componente_tipo',
                      'semana_bimbo', 'dia_entrega', 'fecha',
                      'prediccion_acumulada', 'cant_base',
                      'cantidad_explosionada']]
        if(debug is False):
            # Save to csv
            semanas = sorted(bom.semana_bimbo.unique())
            sem_string = 's'+'-'.join(semanas)
            # bom.to_csv('output/explosionado_' + sem_string + '.csv', index=False)
            return (bom)
        else:
            return explosionado, consolidado, bom

    def _custom_reparture_promedios(self, values):
        value_to_sum = values['total_pedido'].iloc[0]
        n_values = len(values)
        quotient = (value_to_sum / n_values)
        ceil_val = np.ceil(quotient)
        floor_val = np.floor(quotient)
        remainder = value_to_sum % n_values

        new_vals = [ceil_val if x < remainder
                    else floor_val for x in range(n_values)]
        new_vals_series = pd.Series(new_vals, index=values.index)
        return new_vals_series


    def distribute_promedios(self, df, by):
        return_df = df.groupby(by).apply(self._custom_reparture_promedios).reset_index()
        level_col = return_df.columns[-2]
        return return_df.set_index(level_col)[0]


    def _prorate_orders(self, cupos):
        """ ------------------------------------------------------------------------
        Smart prorate by taking a weekly prediction and dividing into respective
        shipment days. Does not work well with n > forecast.
        ------------------------------------------------------------------------"""
        grouped = cupos.groupby(['sucursal_id', 'componente_tipo',
                                 'componente_id', 'semana_bimbo',
                                 'cupo'])["cantidad_explosionada"].sum()
        grouped = grouped.reset_index()
        # Hardcoded column rename
        grouped.columns = ['exp_tot' if x == 'cantidad_explosionada' else x for
                           x in grouped.columns]
        merged = cupos.merge(right=grouped, how='left',
                             on=['sucursal_id', 'componente_tipo',
                                 'componente_id', 'semana_bimbo', 'cupo'])
        merged['total_pedido'] = np.ceil(merged.exp_tot / merged.cupo)
        merged['prorateo'] = merged.cantidad_explosionada / merged.exp_tot
        # Pedido prorateado
        merged['pedido_pro'] = round(merged.total_pedido * merged.prorateo)
        merged['pedido_pro'] = merged.pedido_pro.fillna(0)
        # Ordenar para pedido repartido
        merged = merged.reset_index(drop=True)
        merged = merged.sort_values(['sucursal_id', 'componente_id', 'prorateo'],
                                    ascending=False)
        # Pedido repartido (código de Víctor)
        merged['pedido_rep'] = self.distribute_promedios(merged,
                                                    by=['componente_id',
                                                        'sucursal_id',
                                                        'semana_bimbo'])
        merged = merged.sort_index()
        # Select correct column for distribution
        merged['pedido'] = merged.apply((lambda x: x.pedido_pro
                                         if x.total_pedido >= len(x)
                                         else x.pedido_rep), axis=1)
        # cupos['pedido'] = (np.ceil(cupos.cantidad_explosionada/cupos.cupo))
        return(merged)

    def _businesslogic(pedidos, debug=False):
        return(pedidos)

    def buildorders(self, bom, debug=False, drop_first_week=True):
        """ ------------------------------------------------------------------------
        Takes bom from buildbom() and creates orders by semana_bimbo
        ------------------------------------------------------------------------"""
        # Create cupo df (required: cant_exp grouped by component id and venue)
        cat_cupos = pd.read_csv(
            self._path('catalogues/cupos.csv'),
            usecols=['componente_id', 'cupo']
        )
        cat_cupos.componente_id = cat_cupos.componente_id.astype(str)
        # Intermediate df: grouped (for total materials by venue)
        grouped = bom.groupby(['sucursal_id', 'componente_tipo', 'fecha',
                               'componente_id', 'componente_nombre',
                               'semana_bimbo'])
        cupos = grouped["cantidad_explosionada"].sum().reset_index()
        cupos = cupos.merge(right=cat_cupos, on=['componente_id'])
        pedidos = self._prorate_orders(cupos)

        # Save to csv
        if(drop_first_week is True):
            target_week = max(pedidos.semana_bimbo.unique())
            pedidos = pedidos[pedidos.semana_bimbo == target_week]
            sem_string = 's' + target_week
        else:
            semanas = sorted(pedidos.semana_bimbo.unique())
            sem_string = 's'+'-'.join(semanas)
        # pedidos.to_csv('output/pedidos_' + sem_string + '.csv', index=False)

        # Business logic: MP in containers. Else in units
        pedidos['pedido'] = pedidos.apply((lambda x: x.pedido * x.cupo
                                           if x.componente_tipo != 'MP'
                                           else x.pedido), axis=1)

        # Generate more variables for debugging possible errors
        if(debug is False):
            pedidos = pedidos.drop(['cupo', 'exp_tot', 'total_pedido', 'prorateo'],
                                   axis=1)

        return(pedidos)

    def save_new_format_sucursal(self, df_pedidos_sucursal, dataset):

        fechas_original = df_pedidos_sucursal['fecha'].unique()

        sucursal_id = df_pedidos_sucursal['sucursal_id'].unique()[0]

        fechas = []
        for fecha in fechas_original:
            fechas.append('pedido_'+  pd.to_datetime(fecha).strftime('%Y-%m-%d'))

        df_output = pd.DataFrame()

        components = df_pedidos_sucursal['componente_id'].unique()

        for comp in components:
            repeated_rows = df_pedidos_sucursal[df_pedidos_sucursal['componente_id'] == comp]
            # validar la longitud

            output_row = {
                'sucursal_id': sucursal_id,
                'componente_tipo': repeated_rows.iloc[0]['componente_tipo'],
                'componente_id': repeated_rows.iloc[0]['componente_id'],
                'componente_nombre': repeated_rows.iloc[0]['componente_nombre']
            }
            for fecha, fecha_original in zip(fechas, fechas_original):
                # crear el row con las fechas

                input_row = repeated_rows[repeated_rows['fecha'] == fecha_original]

                if not input_row.empty:
                    suggest_name = str(fecha).replace('pedido', 'sugerido')
                    output_row[fecha] = input_row.iloc[0]['pedido']
                    output_row[suggest_name] = input_row.iloc[0]['pedido']

            df_output = df_output.append(output_row, ignore_index=True)
            df_output.fillna(0, inplace=True)

        #
        # s3 folder where the dataset will be stored
        #
        bucket_name = 'abraxas-intelligence'
        path_s3 = 'elglobo/elglobo_bec/output/'
        identifier = 'pedidos_sucursal_{0}'.format(sucursal_id)

        #
        # CHANGE THIS DATE
        #
        df_output['fecha'] = pd.Timestamp(datetime.now().strftime("%Y-%m-%d"))

        save_s3_dataframe(df_output, bucket_name, path_s3, identifier)
        #
        # save the CSV on torvals
        #
        dataset.append_rows_from_s3(
            '{0}.csv'.format(identifier),
            path_s3[:-1],
            bucket_name,
            target_path=self._path('files/{0}.csv'.format(identifier))
        )

    def modify_format(self, df_pedidos, dataset):
        sucursales = df_pedidos['sucursal_id'].unique()
        message = ''

        logger.info("Sucursales: {}".format(sucursales))

        for id_sucursal in sucursales:

            try:
                df_pedidos_sucursales = df_pedidos[
                    df_pedidos['sucursal_id']== id_sucursal
                ]

                logger.info("Saving sucursal: {}".format(id_sucursal))
                self.save_new_format_sucursal(df_pedidos_sucursales, dataset)
                message = 'The sucursal {0} has loaded successfully.'.format(
                    id_sucursal
                )
            except Exception as e:
                logger.info("Error: {}".format(e))
                message = (
                    'There was an error saving the sucursal: {0} \n'
                    'Error: {1}'
                ).format(id_sucursal, e)

                continue

            send_slack_notifications.apply_async((message,))

    def run(self):
        logger.info("Calculating order.")
        #
        # s3 folder where the dataset will be stored
        #
        bucket_name = 'abraxas-intelligence'
        path_s3 = 'elglobo/elglobo_bec/output/'
        s3_catalogs_path = 'elglobo/elglobo_bec/catalogs'

        s3_catalogs = [
            'calendarios.csv',
            'catalogo_componentes.csv',
            'catalogo_productos.csv',
            'catalogo_sucursales.csv',
            'cupos.csv',
            'proporciones.csv'
        ]

        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_ID,
            aws_secret_access_key=AWS_ACCESS_KEY
        )
        response = s3_client.list_objects_v2(
            Bucket='abraxasiq-data',
            Prefix='elglobo/elglobo_results/orax/'
        )
        last_dataset = max(response['Contents'], key=lambda x: x['LastModified'])

        #
        # download catalogs.
        #
        logger.info("Download catalogues and forecast.")

        #
        # download forecast
        #
        target_forecast_path = '{0}/forecasts/{1}'.format(
            self.current_dir,
            'forecast.csv'
        )

        logger.info('    {0}'.format(last_dataset['Key']))
        download_file(
            last_dataset['Key'],
            target_forecast_path,
            'abraxasiq-data'
        )

        for catalog in s3_catalogs:
            s3_catalog_path = '{0}/{1}'.format(s3_catalogs_path, catalog)
            target_catalog_path = '{0}/catalogues/{1}'.format(
                self.current_dir,
                catalog
            )
            logger.info('    {0}'.format(s3_catalog_path))

            download_file(s3_catalog_path, target_catalog_path, bucket_name)

        logger.info("Catalogues download finished.")

        #
        # build order
        #
        logger.info("Building BOM.")
        bom = self.buildbom()

        logger.info("Building Order.")
        df_pedidos = self.buildorders(bom)

        project = Project.objects.filter(name='Globo')[0]
        Dataset.objects.filter(
            is_main=True,
            project=project
        ).update(is_main=False)

        dataset = Dataset.objects.create(
            name="Globo DS",
            description='Dataset cargado desde S3',
            is_main=True,
            project=project,
            date_adjustment=datetime.now().strftime("%Y-%m-%d")
        )
        self.modify_format(df_pedidos, dataset)
