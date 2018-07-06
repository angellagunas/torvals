import React, { Component } from 'react'
import { loggedIn, verifyRole } from '~base/middlewares/'
import Page from '~base/page'
import tree from '~core/tree'
import api from '~base/api'
import CreateModal from './createModal'

class Forecast extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      createModal: '',
      projectSelected: undefined
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
    })
  }

  async selectProject (project) {
    console.log(project.uuid)
    this.setState({
      projectSelected: project
    })
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

  render () {
    return (
      <div>
        <div className='section-header'>
          <h2>Forecasts</h2>
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
            <CreateModal
              project={this.state.projectSelected}
              className={this.state.createModal}
              hideModal={() => this.hideCreateModal()} />
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
  title: 'Forecast',
  icon: 'bar-chart',
  exact: true,
  roles: 'consultor-level-3, analyst, orgadmin, admin',
  validate: [loggedIn, verifyRole],
  component: Forecast
})
