import React from 'react'

import env from '~base/env-variables'
import Link from '~base/router/link'
import api from '~base/api'
import ListPageComponent from '~base/list-page-component'
import { loggedIn } from '~base/middlewares/'

class AlertList extends ListPageComponent {
  constructor (props) {
    super(props)
    this.state = {
      alertSelected: {}
    }
  }

  async onFirstPageEnter () {
    const organizations = await this.loadOrgs()

    return { organizations }
  }

  async loadOrgs () {
    var url = '/admin/organizations/'
    const body = await api.get(url, {
      start: 0,
      limit: 0
    })

    return body.data
  }

  async deleteObject (row) {
    await api.del('/admin/users/' + row.uuid)
    this.reload()
  }

  finishUp (data) {
    this.setState({
      className: ''
    })

    this.props.history.push(env.PREFIX + '/manage/users/' + data.uuid)
  }

  getFilters () {
    const data = {
      schema: {
        type: 'object',
        required: [],
        properties: {
          general: { type: 'text', title: 'Buscar' }
        }
      },
      uiSchema: {
        general: { 'ui:widget': 'SearchFilter' }
      }
    }

    return data
  }

  toggleModal (alert = {}) {
    this.setState({
      alertSelected: alert,
      alertModal: this.state.alertModal === '' ? 'is-active' : ''
    })
  }

  getColumns () {
    return [
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A'
      },
      {
        'title': 'Tipo',
        'property': 'type',
        'default': 'N/A'
      },
      {
        'title': 'Template',
        'property': 'template',
        'default': 'N/A'
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          return (
            <div>
              <a className='button is-primary' onClick={() => { this.toggleModal(row) }} >
                <span className='icon is-small'>
                  <i className='fa fa-pencil' />
                </span>
              </a>
              <div className={'modal ' + this.state.alertModal}>
                <div className='modal-background' onClick={() => { this.toggleModal() }} />
                <div className='modal-card'>
                  <header className='modal-card-head'>
                    <p className='modal-card-title'>{this.state.alertSelected.name}</p>
                    <button className='delete' aria-label='close' onClick={() => { this.toggleModal() }} />
                  </header>
                  <section className='modal-card-body'>
                    <div className='level'>
                      <div className='level-left'>
                        <div className='level-item'>
                          <div className='field'>
                            <input id='switchRtlExample'
                              type='checkbox'
                              name='switchRtlExample'
                              className='switch is-rtl is-info'
                              /* checked={this.state.alertSelected.status === 'active'}
                              onChange={(e) => this.toggleActive(e.target.value)} */
                            />
                            <label htmlFor='switchRtlExample'>Activar</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )
        }
      }
    ]
  }
}

AlertList.config({
  name: 'user-list',
  path: '/manage/alerts',
  title: 'Alertas',
  icon: 'bell',
  exact: true,
  validate: loggedIn,
  breadcrumbs: true,
  breadcrumbConfig: {
    path: [
      {
        path: '/admin',
        label: 'Inicio',
        current: false
      },
      {
        path: '/admin/manage/alerts/',
        label: 'Alertas',
        current: true
      }
    ],
    align: 'left'
  },
  create: false,
  branchName: 'alerts',
  titleSingular: 'Alerta',
  filters: true,
  schema: {
    type: 'object',
    required: [],
    properties: {
      general: { type: 'text', title: 'Buscar' }
    }
  },
  uiSchema: {
    general: { 'ui:widget': 'SearchFilter' }
  },
  apiUrl: '/admin/alerts',
  detailUrl: '/admin/alerts/'
})

export default AlertList
