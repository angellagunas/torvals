import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import moment from 'moment'
import tree from '~core/tree'
import _ from 'lodash'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import Page from '~base/page'
import { loggedIn } from '~base/middlewares/'
import Graph from '~base/components/graph'
import { BaseTable } from '~base/components/base-table'
import Checkbox from '~base/components/base-checkbox'
import { toast } from 'react-toastify'

export function DownloadWidget({ url, minDate, maxDate, project={}}) {
  return (
    <a
      href={url}
      download={project.name}
      className="card download-card"
    >
      <div className="download-img">
        <img width="40px" src="/app/public/img/cvs-icon.svg" alt="cvs icon"/>
      </div>
      <div className="download-text">
        <h3><strong> {project.name} </strong></h3>
        <span>{`${minDate} / ${maxDate}`}</span>
      </div>
      <div className="download-icon">
        <span className="icon">
          <i className="fa fa-download" />
        </span>
      </div>
    </a>
  )
}

class DownloadReport extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      projectSelected: '',
      projects: [],
      data: null
    }
    this.selectedProjects = {}
    this.currentRole = tree.get('user').currentRole.slug
    this.rules = tree.get('rule')
  }

  componentWillMount() {
    this.getProjects()
  }

  moveTo(route) {
    this.props.history.push(route)
  }

  async getProjects() {
    const url = '/app/projects'
    const res = await api.get(url, {
      showOnDashboard: true
    })

    const activeProjects = res.data.filter(item => item.mainDataset)
    activeProjects[0].selected = true
    this.selectedProjects[activeProjects[0].uuid] = activeProjects[0]

    this.setState({
      projects: activeProjects,
      projectSelected: activeProjects[0],
      loading: false
    }, () => {
      this.getAll()
    })
  }

  async selectProject(project) {
    this.selectedProjects = {}
    this.selectedProjects[project.uuid] = project
    project.selected = true
    this.setState({
      projectSelected: project,
      data: null
    }, () => {
      this.getAll()
    })
  }

  async getAll() {
    const projects = Object.values(this.selectedProjects)

    if (projects.length <= 0) return

    const url = '/app/dashboard/projects'
    const res = await api.get(url, projects.map(p => p.uuid))

    this.setState({
      filters: res
    }, () => this.getData())
  }

  async getData() {
    const url = `/app/adjustmentDownloads/${this.state.projectSelected.uuid}`
    const { data=[] } = await api.get(url)

    data.forEach(item => {
      item.minDate = moment.utc(item.minDate).format('DD-MM-YYYY')
      item.maxDate = moment.utc(item.maxDate).format('DD-MM-YYYY')
    })

    this.setState({ data })
  }

  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
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

  loadTable() {
    if (Object.keys(this.selectedProjects).length === 0) {
      return (
        <center>
          <h1 className='has-text-info'>Debes seleccionar al menos un proyecto</h1>
        </center>
      )
    }
    else if (Object.keys(this.selectedProjects).length !== 0 && !this.state.noData) {
      return (
        <center>
          <h1 className='has-text-info'>Cargando, un momento por favor</h1>
          <Loader />
        </center>
      )
    } else {
      return (
        <div className='is-fullwidth has-text-centered subtitle has-text-primary'>
          {this.state.noData}
        </div>
      )
    }
  }

  render() {
    const user = tree.get('user')

    const {
      loading
    } = this.state

    if (loading) {
      return <Loader />
    }

    return (
      <div className='historic-view'>
        <div className='section-header'>
          <h2>Descarga de ajustes </h2>
        </div>
        <div className='section'>
          <div className='columns filters-project'>
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
                                      <div className="field" key={item.uuid}>
                                        <input
                                          className="is-checkradio is-info is-small"
                                          id={item.name}
                                          type="radio"
                                          name='project'
                                          checked={this.selectedProjects[item.uuid] !== undefined}
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

            <div className='column'>
              {this.state.projectSelected &&
                <h1 className='report-title'>
                  Estos son los ultimos reportes en proyecto
                  <strong> {this.state.projectSelected.name}</strong>
                </h1>
              }

              <div className="has-text-info">
                <span className='icon'>
                  <i className='fa fa-info-circle' />
                </span>
                Recuerda que tus reportes estan disponibles 24 horas
                despues de tu cierre.
              </div>

              <div className='columns'>
                <div className='column'>
                  <section className='section has-30-margin-top'>
                    {
                      this.state.data ?
                        this.state.data.length > 0 ?
                          <div className="columns is-multiline">
                            {
                              this.state.data.map(item => (
                                <div className="column is-4">
                                  <DownloadWidget {...item}/>
                                </div>
                              ))
                            }
                          </div>
                        : <center>
                            <h1 className='has-text-info'>
                              No hay datos que mostrar, intente con otro filtro
                            </h1>
                          </center>
                      : <div> {this.loadTable()} </div>
                    }
                  </section>
                </div>
              </div>



            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/reports/download',
  exact: true,
  validate: loggedIn,
  component: DownloadReport,
  title: 'Descargas',
  icon: 'download'
})
