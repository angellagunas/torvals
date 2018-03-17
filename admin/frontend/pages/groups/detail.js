import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import BaseModal from '~base/components/base-modal'
import GroupForm from './form'
import DeleteButton from '~base/components/base-deleteButton'
import CreateUser from '../users/create'
import tree from '~core/tree'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'

class GroupDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      className: '',
      classNameList: '',
      orgs: [],
      group: {},
      isLoading: ''
    }
  }

  componentWillMount () {
    this.context.tree.set('groups', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10
    })
    this.context.tree.commit()
    this.load()
    this.loadOrgs()
  }

  async load () {
    await this.setState({
      loading: true,
      loaded: false
    })

    var url = '/admin/groups/' + this.props.match.params.uuid

    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        group: body.data
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  async loadOrgs () {
    var url = '/admin/organizations/'
    const body = await api.get(
      url,
      {
        start: 0,
        limit: 0
      }
    )

    this.setState({
      ...this.state,
      orgs: body.data
    })
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
          return <Link className='button is-primary'
            to={'/manage/users/' + row.uuid}>
            <span className='icon is-small'>
              <i className='fa fa-pencil' />
            </span>
          </Link>
        }
      }
    ]
  }

  showModal () {
    this.setState({
      className: ' is-active'
    })
  }

  hideModal () {
    this.setState({
      className: ''
    })
  }

  finishUp (object) {
    this.setState({
      className: ''
    })
  }

  async loadGroupUsers () {
    const body = await api.get(
      '/admin/users',
      {
        start: 0,
        limit: 0,
        group: this.props.match.params.uuid
      }
    )

    this.cursor = this.context.tree.select('users')

    this.cursor.set({
      page: 1,
      totalItems: body.total,
      items: body.data,
      pageLength: this.cursor.get('pageLength') || 10
    })
    this.context.tree.commit()
  }

  async deleteObject () {
    var url = '/admin/groups/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/manage/groups')
  }

  async addToGroup (user) {
    var url = '/admin/users/' + user + '/add/group'
    await api.post(url,
      {
        group: this.props.match.params.uuid
      }
    )

    this.updateUsersToAsign()
    this.loadGroupUsers()
    this.hideModalList()
  }

  async updateUsersToAsign () {
    const cursor = tree.get('usersAsign')
    const updateUsers = await api.get(
      '/admin/users',
      {groupAsign: this.props.match.params.uuid, organization: this.state.group.organization.uuid}
    )

    tree.set('usersAsign', {
      page: cursor.page,
      totalItems: updateUsers.total,
      items: updateUsers.data,
      pageLength: cursor.pageLength
    })
    tree.commit()
  }

  getColumnsUsersToAsign () {
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
          return (
            <button className='button' onClick={e => { this.addToGroup(row.uuid) }}>
              Agregar al grupo
            </button>
          )
        }
      }
    ]
  }

  showModalList () {
    this.setState({
      classNameList: ' is-active'
    })
  }

  hideModalList () {
    this.setState({
      classNameList: ''
    })
  }

  finishUpList (object) {
    this.setState({
      classNameList: ''
    })
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
      return <NotFound msg='este grupo' />
    }

    const { group } = this.state

    if (!group.uuid) {
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
                  path: '/admin/manage/groups',
                  label: 'Grupos',
                  current: false
                },
                {
                  path: '/admin/manage/groups/detail/',
                  label: 'Detalle',
                  current: true
                },
                {
                  path: '/admin/manage/groups/detail/',
                  label: group.name,
                  current: true
                }
              ]}
              align='left'
            />
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <DeleteButton
                      titleButton={'Eliminar Grupo'}
                      objectName='Grupo'
                      objectDelete={this.deleteObject.bind(this)}
                      message={`Está seguro que quiere eliminar el grupo ${group.name}?`}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Grupo
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <GroupForm
                          baseUrl='/admin/groups'
                          url={'/admin/groups/' + this.props.match.params.uuid}
                          initialState={{...this.state.group, organization: this.state.group.organization._id}}
                          load={this.load.bind(this)}
                          organizations={this.state.orgs || []}
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
                        </GroupForm>
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
                    <div className='card-header-select'>
                      <button className='button is-primary' onClick={() => this.showModalList()}>
                        Agregar usuario existente
                      </button>
                      <BaseModal
                        title='Usuarios para asignar'
                        className={this.state.classNameList}
                        finishUp={this.finishUpList.bind(this)}
                        hideModal={this.hideModalList.bind(this)}
                         >
                        <BranchedPaginatedTable
                          branchName='usersAsign'
                          baseUrl='/admin/users'
                          columns={this.getColumnsUsersToAsign()}
                          filters={{groupAsign: this.props.match.params.uuid, organization: group.organization.uuid}}
                         />
                      </BaseModal>

                    </div>
                    <div className='card-header-select'>
                      <button className='button is-primary' onClick={() => this.showModal()}>
                        Nuevo Usuario
                      </button>
                      <CreateUser
                        className={this.state.className}
                        finishUp={this.finishUp.bind(this)}
                        hideModal={this.hideModal.bind(this)}
                        branchName='users'
                        baseUrl='/admin/users'
                        url='/admin/users/'
                        filters={{group: this.props.match.params.uuid}}
                        organization={group.organization._id}
                      />
                    </div>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <BranchedPaginatedTable
                          branchName='users'
                          baseUrl='/admin/users'
                          columns={this.getColumns()}
                          filters={{group: this.props.match.params.uuid}}
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
    )
  }
}

GroupDetail.contextTypes = {
  tree: PropTypes.baobab
}

const branchedGroupDetail = branch({groups: 'groups'}, GroupDetail)

export default Page({
  path: '/manage/groups/:uuid',
  title: 'Detalles de grupo',
  exact: true,
  validate: loggedIn,
  component: branchedGroupDetail
})
