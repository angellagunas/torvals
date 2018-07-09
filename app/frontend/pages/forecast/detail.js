import React, { Component } from 'react'
import { loggedIn, verifyRole } from '~base/middlewares/'
import Page from '~base/page'
import Breadcrumb from '~base/components/base-breadcrumb'
import DeleteButton from '~base/components/base-deleteButton'
import Loader from '~base/components/spinner'

class ForecastDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true
    }
  }

  loadTable () {
    return (
      <div className='is-fullwidth has-text-centered subtitle has-text-primary'>
        {this.state.noData}
      </div>
    )
  }
  render () {
    /* if (this.state.loading) {
      return <div className='column is-fullwidth has-text-centered subtitle has-text-primary'>
        Cargando, un momento por favor
          <Loader />
      </div>
    } */
    return (
      <div>
        <div className='section-header'>
          <h2>Forecasts Detail</h2>
        </div>
        <div className='level'>
          <div className='level-left'>
            <div className='level-item'>
              <Breadcrumb
                path={[
                  {
                    path: '/',
                    label: 'Inicio',
                    current: false
                  },
                  {
                    path: '/forecast',
                    label: 'Predicciones',
                    current: false
                  },
                  {
                    path: '/forecast/detail',
                    label: 'Detalle',
                    current: true
                  },
                  {
                    path: '/forecast/detail',
                    label: 'titulo prediccion',
                    current: true
                  }
                ]}
                align='left'
              />
            </div>
          </div>
          <div className='level-right'>
            <div className='level-item'>
              <a
                className='button is-info'
                onClick={() => { this.props.selectGroup() }}>
                Regresar
              </a>
            </div>
            <div className='level-item'>
              <DeleteButton
                titleButton={'Eliminar'}
                objectName='Grupo'
                objectDelete={this.deleteObject}
                message={`¿Está seguro que desea eliminar el grupo?`}
              />
            </div>
          </div>
        </div>

        <div className='section columns box'>
          <div className='column is-3 is-2-widescreen is-paddingless'>
            <div className='notification is-info has-text-centered'>
              <h1 className='title is-2'>0</h1>
              <h2 className='subtitle has-text-weight-bold'>MAPE</h2>
            </div>
            <div className='indicators'>
              <p className='indicators-title'>Venta total</p>
              <p className='indicators-number has-text-success'>
                0
              </p>
              <p className='indicators-title'>Venta año anterior</p>
              <p className='indicators-number has-text-danger'>
                0
              </p>

              <p className='indicators-title'>Ajuste total</p>
              <p className='indicators-number has-text-teal'>
                0
              </p>

              <p className='indicators-title'>Predicción total</p>
              <p className='indicators-number has-text-info'>
                0
              </p>
            </div>
          </div>
          <div className='column card'>
            {this.state.graphData && this.state.filteredData
              ? this.state.graphData.length > 0
                ? <Graph
                  data={graph}
                  maintainAspectRatio={false}
                  responsive
                  reloadGraph={this.state.reloadGraph}
                  legend={{
                    display: true,
                    position: 'right',
                    fontSize: 11,
                    labels: {
                      boxWidth: 10,
                      fontStyle: 'normal',
                      fontFamily: "'Roboto', sans-serif",
                      usePointStyle: false,
                      padding: 12
                    }
                  }}
                  tooltips={{
                    mode: 'index',
                    intersect: true,
                    titleFontFamily: "'Roboto', sans-serif",
                    bodyFontFamily: "'Roboto', sans-serif",
                    bodyFontStyle: 'bold',
                    callbacks: {
                      label: tooltipCallback
                    }
                  }}
                  labels={this.state.graphData.map((item) => { return item.date })}
                  scales={{
                    xAxes: [
                      {
                        ticks: {
                          callback: function (label, index, labels) {
                            return moment.utc(label).format('DD-MM-YYYY')
                          },
                          fontSize: 11
                        },
                        gridLines: {
                          display: false
                        }
                      }
                    ],
                    yAxes: [
                      {
                        ticks: {
                          callback: callbackLabels,
                          fontSize: 11
                        },
                        gridLines: {
                          display: false
                        },
                        display: true
                      }
                    ]
                  }}
                  annotation={this.state.startPeriod &&
                    {
                      annotations: [
                        {
                          drawTime: 'beforeDatasetsDraw',
                          type: 'box',
                          xScaleID: 'x-axis-0',
                          yScaleID: 'y-axis-0',
                          xMin: this.state.startPeriod,
                          xMax: this.state.endPeriod,
                          yMin: 0,
                          yMax: this.state.topValue,
                          backgroundColor: 'rgba(233, 238, 255, 0.5)',
                          borderColor: 'rgba(233, 238, 255, 1)',
                          borderWidth: 1
                        },
                        {
                          drawTime: 'afterDatasetsDraw',
                          id: 'vline',
                          type: 'line',
                          mode: 'vertical',
                          scaleID: 'x-axis-0',
                          value: this.state.startPeriod,
                          borderColor: 'rgba(233, 238, 255, 1)',
                          borderWidth: 1,
                          label: {
                            backgroundColor: 'rgb(233, 238, 255)',
                            content: 'Ciclo actual',
                            enabled: true,
                            fontSize: 10,
                            position: 'top',
                            fontColor: '#424A55'
                          }
                        },
                        ...vLines
                      ]
                    }
                  }
                />
                : <section className='section has-30-margin-top'>
                  <center>
                    <h1 className='has-text-info'>No hay datos que mostrar, intente con otro filtro</h1>
                  </center>
                </section>
              : <section className='section has-30-margin-top'>
                {this.loadTable()}
              </section>
            }

          </div>
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/forecast/detail/:uuid',
  title: 'Forecast',
  icon: 'bar-chart',
  exact: true,
  roles: 'consultor-level-3, analyst, orgadmin, admin',
  validate: [loggedIn, verifyRole],
  component: ForecastDetail
})
