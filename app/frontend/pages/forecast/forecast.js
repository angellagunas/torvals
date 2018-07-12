import React, { Component } from 'react'
import { loggedIn, verifyRole } from '~base/middlewares/'
import Page from '~base/page'
import tree from '~core/tree'
import api from '~base/api'
import CreateModal from './createModal'
import Loader from '~base/components/spinner'
import Link from '~base/router/link'
import DeleteButton from '~base/components/base-deleteButton'
import BaseModal from '~base/components/base-modal'
import moment from 'moment'
import { toast } from 'react-toastify'

class Forecast extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      createModal: '',
      projectSelected: undefined,
      forecasts: []
    }

    this.currentRole = tree.get('user').currentRole.slug
    this.rules = tree.get('rule')
  }

  componentWillMount () {
    this.getProjects()
  }

  moveTo (route) {
    this.props.history.push(route)
  }

  notify (message = '', timeout = 5000, type = toast.TYPE.INFO) {
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false
      })
    }
  }

  async getProjects () {
    let url = '/app/projects'

    let res = await api.get(url, {
      hasMainDataset: true
    })

    let activeProjects = res.data.filter(item => { return item.mainDataset })
    activeProjects[0].selected = true

    this.setState({
      projects: activeProjects,
      projectSelected: activeProjects[0],
      loading: false
    }, () => {
      this.getForecast()
    })
  }

  async selectProject (project) {
    this.setState({
      projectSelected: project
    }, () => {
      this.getForecast()
    })
  }

  async getForecast () {
    this.setState({
      loadingForecasts: true
    })
    let url = '/app/forecastGroups'
    try {
      let res = await api.get(url, {
        project: this.state.projectSelected.uuid
      })

      if (res.data) {
        this.setState({
          forecasts: res.data,
          loadingForecasts: false
        })
      } else {
        this.setState({
          forecasts: [],
          loadingForecasts: false
        })
      }
    } catch (e) {
      console.log(e)
      this.setState({
        forecasts: [],
        loadingForecasts: false
      })
    }
  }

  showCreateModal () {
    this.setState({
      createModal: 'is-active'
    })
  }

  hideCreateModal () {
    this.setState({
      createModal: ''
    })
  }

  forecastMenu (item) {
    return (
      <div className='dropdown is-right is-hoverable'>
        <div className='dropdown-trigger'>
          <span className='icon is-small' aria-haspopup='true' aria-controls='dropdown-menu6'>
            <i className='fa fa-ellipsis-h' aria-hidden='true' />
          </span>
        </div>
        <div className='dropdown-menu' id='dropdown-menu6' role='menu'>
          <div className='dropdown-content'>
            <div className='dropdown-item'>
              <button className='button is-primary is-small'
                onClick={() => this.moveTo('/forecast/detail/' + item.uuid)}
              >Detalle</button>
            </div>
            <div className='dropdown-item'>
              <DeleteButton
                buttonClass='is-small'
                hideIcon
                objectName='Predicción'
                objectDelete={() => this.deleteForecast(item)}
                message={<span>¿Estas seguro de querer eliminar esta Predicción?</span>}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  async deleteForecast (item) {
    let url = '/app/forecastGroups/'
    try {
      let res = await api.del(url + item.uuid)

      if (res) {
        this.getForecast()
        this.notify('Predicción eliminada con éxito', 3000)
      }
    } catch (e) {
      console.log(e)
    }
  }

  forecasts () {
    return (
      <div className='column'>
        <div className='level'>
          <div className='level-left'>
            <div className='level-item'>
              <h2>Tienes {this.state.forecasts.length}
                {this.state.forecasts.length > 1 ? ' predicciones disponibles' : ' predicción disponible'} </h2>
            </div>
          </div>
          <div className='level-right'>
            <div className='level-item'>
              <button className='button is-primary'
                onClick={() => this.showCreateModal()}>
                Nueva predicción
              </button>
            </div>
          </div>
        </div>
        <div className='columns is-multiline forecast-widget'>
          {
            this.state.forecasts.map(item => {
              return (
                <div key={item.uuid} className='column is-4'>
                  <div className='box'>

                    <article className='media'>
                      <div className='media-content'>
                        <div className='contents'>
                          <div className='forecast-widget__title'>
                            <strong onClick={() => this.moveTo('/forecast/detail/' + item.uuid)}>{item.alias}</strong>
                            <small className='is-pulled-right'>
                              {this.forecastMenu(item)}
                            </small>
                            <br />
                          </div>

                          <p>
                            <strong>Reporte
                              <span className='is-capitalized is-pulled-right'>
                              Ciclos
                              </span>
                            </strong>
                            <br />
                            {item.type === 'compatible' ? 'Conciliable'
                              : item.type === 'informative' ? 'Informativo' : 'Creado'}
                            <span className='is-capitalized is-pulled-right'>
                              {item.cycles.length > 0 &&
                              moment.utc(item.cycles[0].dateStart).format('MMMM') +
                            ' #' + item.cycles[0].cycle + ' - ' +
                            moment.utc(item.cycles[item.cycles.length - 1].dateStart).format('MMMM') +
                            ' #' + item.cycles[item.cycles.length - 1].cycle
                            }
                            </span>
                          </p>
                          <div>
                            <strong>Catálogos</strong>
                            <br />
                            <div>
                              {item.type === 'compatible'
                            ? this.rules.catalogs.map((item, key) => {
                              let cat = item.name + ', '
                              if (key === this.rules.catalogs.length - 1) {
                                cat = item.name
                              }
                              return (
                                <Link key={item.uuid}
                                  to={'/catalogs/' + item.slug}>
                                  {cat}
                                </Link>
                              )
                            })
                            : item.catalogs.map((obj, key) => {
                              let cat = obj.name + ', '
                              if (key === item.catalogs.length - 1) {
                                cat = obj.name
                              }
                              return (
                                <Link key={obj.uuid}
                                  to={'/catalogs/' + obj.slug}>
                                  {cat}
                                </Link>
                              )
                            })
                          }
                            </div>
                          </div>
                          <div>
                            <strong>Modelos</strong>
                            <br />
                            {item.engines.map((obj, key) => {
                              let engine = obj.name + ', '
                              if (key === item.engines.length - 1) {
                                engine = obj.name
                              }
                              return <span key={obj.uuid}>{engine}</span>
                            })}
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>
    )
  }

  finishUp (forecast) {
    this.showForecastMsg(forecast)
    this.getForecast()
  }

  forecastMsg () {
    return (
      <BaseModal
        title={'Predicción en proceso'}
        className={this.state.forecastMsg}
        hideModal={this.hideForecastMsg}>
        <p>Tu predicción se está generando. <br />
        Este proceso puede tomar mucho tiempo.
        Te avisaremos por correo cuando el proceso termine.
        </p>
        <br />
        <button
          className='button generate-btn is-primary is-pulled-right'
          onClick={() => this.hideForecastMsg()}>
          Aceptar
        </button>
      </BaseModal>
    )
  }

  showForecastMsg (forecast) {
    this.setState({
      forecastMsg: ' is-active',
      activeForecast: forecast
    })
  }

  hideForecastMsg () {
    this.setState({
      forecastMsg: '',
      activeForecast: undefined
    })
  }

  render () {
    if (this.state.loading) {
      return (
        <div className='column is-fullwidth has-text-centered subtitle has-text-primary'>
          Cargando, un momento por favor
          <Loader />
        </div>
      )
    }
    return (
      <div>
        <div className='section-header'>
          <h2>Predicciones</h2>
        </div>
        <div className='section'>
          {this.state.projects &&
          this.state.projects.length > 0 &&
          this.state.projectSelected
          ? <div className='columns filters-project '>
            <div className='column is-3'>
              <div className='columns is-multiline'>
                <div className='column is-12'>

                  <div className='card projects'>
                    <div className='card-header'>
                      <h1>
                        <span className='icon'>
                          <i className='fa fa-folder' />
                        </span>
                        Proyectos</h1>
                    </div>
                    <div className='card-content'>
                      <aside className='menu' disabled={this.state.waitingData}>
                        <ul className='menu-list'>
                          {this.state.projects &&
                            this.state.projects.map((item) => {
                              if (item.mainDataset) {
                                if (!item.selected) {
                                  item.selected = false
                                }
                                return (
                                  <li key={item.uuid}>
                                    <a>
                                      <div className='field' key={item.uuid}>
                                        <input
                                          className='is-checkradio is-info is-small'
                                          id={item.name}
                                          type='radio'
                                          name='project'
                                          checked={item.uuid === this.state.projectSelected.uuid}
                                          disabled={this.state.waitingData}
                                          onChange={() => this.selectProject(item)} />
                                        <label htmlFor={item.name}>
                                          {<span title={item.name}>{item.name}</span>}
                                        </label>
                                      </div>
                                      <span className='icon is-pulled-right' onClick={() => { this.moveTo('/projects/' + item.uuid) }}>
                                        <i className={this.currentRole === 'consultor-level-3' ? 'fa fa-eye has-text-info' : 'fa fa-edit has-text-info'} />
                                      </span>
                                    </a>
                                  </li>
                                )
                              }
                            })
                          }
                        </ul>
                      </aside>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {this.state.loadingForecasts &&
            <div className='column is-fullwidth has-text-centered subtitle has-text-primary'>
                  Cargando, un momento por favor
                  <Loader />
            </div>
            }
            {!this.state.loadingForecasts && this.state.forecasts.length === 0 &&
              <div className='column'>
                <article className='message is-info'>
                  <div className='message-header has-text-weight-bold'>
                    <p>Configuración de predicciones</p>
                  </div>
                  <div className='message-body is-size-6 has-text-centered'>
                    <span className='icon is-large has-text-info'>
                      <i className='fa fa-magic fa-2x' />
                    </span>
                    <span className='is-size-5'>
                   Aún no tienes predicciones disponibles para este proyecto.
                   </span>
                    <br />
                    <br />
                    <a
                      className='button is-info is-medium'
                      onClick={() => this.showCreateModal()}>
                      <span>Crear</span>
                    </a>
                  </div>
                </article>
              </div>
            }

            {
              !this.state.loadingForecasts && this.state.forecasts.length > 0 &&
              this.forecasts()
            }

            {this.forecastMsg()}
            <CreateModal
              project={this.state.projectSelected}
              className={this.state.createModal}
              hideModal={() => this.hideCreateModal()}
              finishUp={() => this.finishUp()} />
          </div>
        : <div className='columns is-centered'>
          <div className='column is-8'>
            <article className='message is-info'>
              <div className='message-header has-text-weight-bold'>
                <p>Configuración de predicciones</p>
              </div>
              <div className='message-body is-size-6 has-text-centered'>
                <span className='icon is-large has-text-info'>
                  <i className='fa fa-magic fa-2x' />
                </span>
                <span className='is-size-5'>
                  Debes crear al menos un proyecto para poder crear una predicción
                   </span>
                <br />
                <br />
                <a
                  className='button is-info is-medium'
                  onClick={() => this.showCreateModal()}>
                  <span>Crear</span>
                </a>
              </div>
            </article>
          </div>
        </div>
          }
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/forecast',
  title: 'Predicciones',
  icon: 'bar-chart',
  exact: true,
  roles: 'consultor-level-3, analyst, orgadmin, admin',
  validate: [loggedIn, verifyRole],
  component: Forecast
})
