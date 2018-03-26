import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import RoleForm from './form'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import DeleteButton from '~base/components/base-deleteButton'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'

class RoleDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      role: {},
      isLoading: ''
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = '/admin/roles/' + this.props.match.params.uuid
    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        role: body.data
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  getColumns () {
    return [
      {
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Email',
        'property': 'email',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          return <Link className='button is-primary' to={'/manage/users/' + row.uuid}>
            <span className='icon is-small' title='Editar'>
              <i className='fa fa-pencil' />
            </span>
          </Link>
        }
      }
    ]
  }

  async deleteObject () {
    var url = '/admin/roles/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/manage/roles')
  }

  async defaultOnClick () {
    var url = '/admin/roles/' + this.props.match.params.uuid + '/setDefault'
    await api.post(url)
    this.load()
  }

  getDeleteButton () {
    if (!this.state.role.isDefault) {
      return (
        <div className='column has-text-right'>
          <div className='field is-grouped is-grouped-right'>
            <div className='control'>
              <DeleteButton
                titleButton={'Delete'}
                objectName='Roles'
                objectDelete={this.deleteObject.bind(this)}
                message={`Are you sure you want to delete the role ${this.state.role.name}?`}
                    />
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  getDefaultButton () {
    if (!this.state.role.isDefault) {
      return (
        <div className='column'>
          <div className='field is-grouped is-grouped-left'>
            <div className='control'>
              <button
                className='button is-primary'
                type='button'
                onClick={() => this.defaultOnClick()}
                >
                  Establecer por defecto
                </button>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  finishUpHandler () {
    this.setState({ isLoading: '' })
  }

  render () {
    if (this.state.notFound) {
      return <NotFound msg='este rol' />
    }

    const { role } = this.state

    if (!role.uuid) {
      return <Loader />
    }
    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top pad-sides'>
            <Breadcrumb
              path={[
                {
                  path: '/admin',
                  label: 'Inicio',
                  current: false
                },
                {
                  path: '/admin/manage/roles',
                  label: 'Roles',
                  current: false
                },
                {
                  path: '/admin/manage/roles',
                  label: 'Detalle',
                  current: true
                },
                {
                  path: '/admin/manage/roles',
                  label: role.name,
                  current: true
                }
              ]}
              align='left'
            />
            <br />
            <div className='columns'>
              {this.getDefaultButton()}
              {this.getDeleteButton()}
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Rol
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <RoleForm
                          baseUrl='/admin/roles'
                          url={'/admin/roles/' + this.props.match.params.uuid}
                          initialState={this.state.role}
                          load={this.load.bind(this)}
                          submitHandler={(data) => this.submitHandler(data)}
                          errorHandler={(data) => this.errorHandler(data)}
                          finishUp={(data) => this.finishUpHandler(data)}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button
                                className={'button is-primary ' + this.state.isLoading}
                                disabled={!!this.state.isLoading}
                                type='submit'
                              >Guardar</button>
                            </div>
                          </div>
                        </RoleForm>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Usuarios
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <div className='column'>
                          <BranchedPaginatedTable
                            branchName='users'
                            baseUrl='/admin/users'
                            columns={this.getColumns()}
                            filters={{role: this.props.match.params.uuid}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

RoleDetail.contextTypes = {
  tree: PropTypes.baobab
}

const branchedRoleDetails = branch({roles: 'roles'}, RoleDetail)

export default Page({
  path: '/manage/roles/:uuid',
  title: 'Roles details',
  exact: true,
  validate: loggedIn,
  component: branchedRoleDetails
})
