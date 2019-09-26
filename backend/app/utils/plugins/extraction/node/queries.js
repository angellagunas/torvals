module.exports = {
  query: () => `select * from CatCodigoBarras`,
  columns: () => `
    SELECT syscolumns.name as name, systypes.name as type, sysobjects.name as tablename
    FROM sysobjects 
    JOIN syscolumns ON sysobjects.id = syscolumns.id
    JOIN systypes ON systypes.type = syscolumns.type AND systypes.usertype = syscolumns.usertype
  `,
  // WHERE sysobjects.name LIKE 'CatCodigoBarras'
  // WHERE sysobjects.name LIKE 'CODIGO_CATEGORIA'
  tables: () => `
    select name
    from sysobjects o
    where type = 'U'
  `,
  rutas: () => `
    SELECT
      canal.AG47DS descripcion_canal,
      canal.AG47ID id_canal,
      r.codigo_agencia,
      r.codigo_ruta,
      r.codigo_fabrica,
      r.carga_adelantada
    FROM ruta r
    INNER JOIN linea_ruta lr ON r.cod_linea_ruta=lr.cod_linea_ruta 
    INNER JOIN AGM047 canal ON canal.AG47ID=lr.AG47ID
  `,
  productos: () => `
    SELECT codigo_producto, descr_producto, codigo_barras from producto
  `, //HHC_PRODUCTO HHc_Productos Meta_semanal ruta_cliente CATEGORIA_PRODUCTOS
  clientes: () => `
    SELECT 
      DISTINCT c.ID_CLIENTE,c.DESCRIPCION_CLIENTE,c.ID_RUTA,
      gps.codigoAgencia codigo_agencia, 
      gps.latitud, 
      gps.longitud 
    FROM ClienteGpsNormalizado gps 
    INNER JOIN HHc_Clientes c ON c.ID_CLIENTE=gps.CLICOD 
  `,
  recorridos: date => `
    select
      Anio,
      Semana,
      ag.codigo_agencia,
      null as agencia,
      CLICOD,
      Nombre,
      Direccion,
      AG3COD,
      Fecha_Liquidacion,
      Fecha_Atencion,
      ruta_reparto,
      grupo,
      cod_linea_ruta,
      Canal,
      orden,
      Venta,
      Devolucion,
      AGT5CE,
      Comodin,
      Estatus
    from(
        select
          distinct(reg.CLICOD) as Distincion,
          datepart(yy, reg.FechaActualizacion) as Anio,
          null as Semana,
          case
            when reg.CLICOD = '999999999999999' then cc.CLICOD
            else reg.CLICOD
          END as CLICOD,
          isnull(a1.CLINOM, cc.CLINOM) as Nombre,
          isnull(
            a1.AG1CAL + ' ' + a1.AG1EXT + ', Col.' + a1.AG1COL + ', Cd. ' + a1.AG1CIU,
            cc.Direccion
          ) as Direccion,
          isnull(a1.AG3COD, cc.AG3COD) as AG3COD,
          reg.FechaActualizacion as Fecha_Liquidacion,
          reg.AGT4FC as Fecha_Atencion,
          reg.codigo_ruta ruta_preventa,
          isnull(a106.ruta_rep, reg.codigo_ruta) as ruta_reparto,
          ruta_une.codigo_supervisor as grupo,
          ruta_une.cod_linea_ruta,
          ruta_une.AG47DS as Canal,
          reg.orden,
          CONVERT(VARCHAR(10), reg.AGT5HL, 108) as Ini_Cte,
          CONVERT(VARCHAR(10), reg.AGT5HS, 108) as Fin_Cte,
          CONVERT(VARCHAR(10), reg.AGT5HL, 108) as Hora_Inicio,
          CONVERT(VARCHAR(10), reg.AGT5HS, 108) as Hora_Fin,
          reg.Venta,
          reg.Devolucion,
          case
            when CONVERT(VARCHAR(10), reg.AGT5HL, 108) = CONVERT(VARCHAR(10), reg.AGT5HS, 108)
            and Venta = 0
            and reg.Estatus = 'Cerrado' then convert(bit, 1)
            else convert(bit, 0)
          end as AGT5CE,
          case
            when reg.CLICOD = '999999999999999' then 1
            else 0
          end as Comodin,
          reg.Estatus,
          convert(varchar, isnull(cl.latitud, 0.0)) as Latitud_Lectura,
          convert(varchar, isnull(cl.longitud, 0.0)) as Longitud_Lectura,
          isnull(
            isnull(
              convert(varchar, gpsn.Latitude),
              convert(varchar, gps.latitud)
            ),
            '0.0'
          ) as Latitud_Normalizada,
          isnull(
            isnull(
              convert(varchar, gpsn.Longitude),
              convert(varchar, gps.longitud)
            ),
            '0.0'
          ) as Longitud_Normalizada
        from
          (
            select
              CLICOD,
              FechaActualizacion,
              AGT4FC,
              codigo_ruta,
              AGT5NU as orden,
              '00:00:00' AGT5HL,
              '00:00:00' AGT5HS,
              AGT5TV as Venta,
              0 as Devolucion,
              AGT5CE,
              'No Visitado' as Estatus
            from
              AGT005 a5
              left outer join (
                select
                  compara
                from
                  (
                    select
                      distinct(CLICOD) as CLICOD,
                      CLICOD + '_' + codigo_ruta as compara
                    from
                      Registro_Visitas
                    where
                      fecha between '${date}'
                      and '${date}'
                  ) resumen_compara
              ) a on a5.CLICOD + '_' + a5.codigo_ruta = a.compara
              left outer join (
                select
                  CLICOD + '_' + codigo_ruta as compara
                from
                  CLIENTE_COMODIN
              ) comodin on a5.CLICOD + '_' + a5.codigo_ruta = comodin.compara
            where
              a.compara is null
              and comodin.compara is null
              and FechaActualizacion between '${date}'
              and '${date}'
            union
            select
              distinct(CLICOD) as CLICOD,
              fecha as FechaActualizacion,
              CONVERT(VARCHAR(10), AGT5HL, 103) as AGT4FC,
              codigo_ruta,
              orden,
              CONVERT(VARCHAR(10), AGT5HL, 108) AGT5HL,
              CONVERT(VARCHAR(10), AGT5HS, 108) AGT5HS,
              Venta,
              Devolucion,
              case
                when CONVERT(VARCHAR(10), AGT5HL, 108) = CONVERT(VARCHAR(10), AGT5HS, 108)
                and Venta = 0 then convert(bit, 1)
                else convert(bit, 0)
              end as AGT5CE,
              case
                when CONVERT(VARCHAR(10), AGT5HL, 108) = CONVERT(VARCHAR(10), AGT5HS, 108)
                and Venta = 0 then 'Cerrado'
                else 'Visitado'
              end as Estatus
            from
              Registro_Visitas reg
            where
              fecha between '${date}'
              and '${date}'
          ) reg
          left outer join (
            select
              r.codigo_ruta,
              r.codigo_supervisor,
              r.codigo_vendedor,
              r.cod_linea_ruta,
              r.AG47ID,
              a47.AG47DS
            from
              ruta r
              left outer join AGM047 a47 on r.AG47ID = a47.AG47ID
            union
            select
              r.codigo_ruta,
              r.codigo_supervisor,
              r.codigo_vendedor,
              r.cod_linea_ruta,
              r.AG47ID,
              a47.AG47DS
            from
              AGM032 r
              left outer join AGM047 a47 on r.AG47ID = a47.AG47ID
          ) ruta_une on reg.codigo_ruta = ruta_une.codigo_ruta
          left outer join AGM001 a1 on reg.CLICOD = a1.CLICOD
          left outer join AGM106 a106 on reg.codigo_ruta = a106.ruta_pre
          left outer join (
            select
              cc.codigo_ruta,
              cc.CLICOD,
              a1_2.CLINOM as CLINOM,
              a1_2.AG1CAL + ' ' + a1_2.AG1EXT + ', Col.' + a1_2.AG1COL + ', Cd. ' + a1_2.AG1CIU as Direccion,
              a1_2.AG3COD
            from
              CLIENTE_COMODIN cc
              left outer join AGM001 a1_2 on cc.CLICOD = a1_2.CLICOD
          ) cc on reg.codigo_ruta = cc.codigo_ruta
          left outer join (
            select
              rtrim(ltrim(pk)) as CLICOD,
              case
                when isnull(valor, '0.0,0.0') is not null then ltrim(
                  substring(
                    isnull(valor, '0.0,0.0'),
                    1,
                    charindex(',', isnull(valor, '0.0,0.0')) -1
                  )
                )
              end as Latitude,
              case
                when isnull(valor, '0.0,0.0') is not null then ltrim(
                  substring(
                    isnull(valor, '0.0,0.0'),
                    charindex(',', isnull(valor, '0.0,0.0')) + 1,
                    len(isnull(valor, '0.0,0.0'))
                  )
                )
              end as Longitude
            from
              EXT_DatosCatalogo
            where
              catalogo = 'Cliente'
              and campo = 'COORDENADAS'
              and pk not like '#%'
              and valor like '%,-%'
          ) gpsn on reg.CLICOD = gpsn.CLICOD
          left outer join ClienteGpsNormalizado gps on reg.CLICOD = gps.CLICOD
          left outer join (
            select
              codigo_ruta as Ruta,
              fechaLiq as Fecha_Liquidacion,
              CLICOD as Cliente,
              avg(
                case
                  when tipoLectura = 2 then latitud
                  when tipoLectura = 3 then latitud
                  when tipoLectura = 4 then latitud
                end
              ) as latitud,
              avg(
                case
                  when tipoLectura = 2 then longitud
                  when tipoLectura = 3 then longitud
                  when tipoLectura = 4 then longitud
                end
              ) as longitud
            from
              customerLocation
            where
              fechaLiq between '${date}'
              and '${date}'
            group by
              codigo_ruta,
              fechaLiq,
              CLICOD
          ) cl on reg.FechaActualizacion = cl.Fecha_Liquidacion
          and reg.codigo_ruta = cl.Ruta
          and reg.CLICOD = cl.Cliente
        where
          reg.FechaActualizacion between '${date}'
          and '${date}'
      ) inter,
      agencia ag
  `
};
