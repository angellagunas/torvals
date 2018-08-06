import React from 'react'
import ListPageComponent from '~base/list-page-component'
import { loggedIn } from '~base/middlewares/'
import AlertModal from './alert-modal'

class AlertList extends ListPageComponent {
  constructor (props) {
    super(props)
    this.state = {
      alertSelected: {},
      alertModal: ''
    }
  }

  toggleModal (alert = {}) {
    this.setState({
      alertSelected: alert,
      alertModal: this.state.alertModal === '' ? 'is-active' : ''
    })
  }

  finishUp () {
    this.reload()
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
        'title': 'Descripción',
        'property': 'description',
        'default': 'N/A'
      },
      {
        'title': 'Habilitado',
        'property': 'status',
        'default': 'N/A',
        className: 'has-text-centered',
        formatter: (row) => {
          if (row.status === 'active') {
            return (
              <span className='icon has-text-success'>
                <i className='fa fa-check fa-lg' />
              </span>
            )
          } else {
            return (
              <span className='icon has-text-danger'>
                <i className='fa fa-times fa-lg' />
              </span>
            )
          }
        }
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
              <AlertModal
                alertModal={this.state.alertModal}
                alertSelected={this.state.alertSelected}
                toggleModal={() => this.toggleModal()}
                finishUp={() => this.finishUp()}
                />
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
