import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import GroupForm from './form'
import DeleteButton from '~base/components/base-deleteButton'
import CreateUser from '../users/create'
import BaseModal from '~base/components/base-modal'
import tree from '~core/tree'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'

var currentRole

class GroupDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      group: {},
      isLoading: ''
    }
    this.rules = tree.get('rule')

    currentRole = tree.get('user').currentRole.slug
  }

  componentWillMount () {
    tree.set('groups', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10
    })
    tree.commit()
    this.getChannels()
    this.getSalesCenters()
    this.load()
  }

  findCatalogName = (name) => {
    let find = ''
    this.rules.catalogs.map(item => {
      if (item.slug === name) {
        find = item.name
      }
    })
    return find
  }

  async load () {
    var url = '/app/groups/' + this.props.group.uuid

    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        group: body.data,
        catalogItems: _(body.data.catalogItems)
          .groupBy(x => x.type)
          .map((value, key) => ({
            type: this.findCatalogName(key),
            objects: value
          }))
          .value()
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
      /* {
        'title': 'Acciones',
        formatter: (row) => {
          if (currentRole === 'consultor-level-3' || currentRole === 'consultor-level-2') {
            return <Link className='button is-primary' to={'/manage/users/' + row.uuid}>
              <span className='icon is-small'>
                <i className='fa fa-eye' />
              </span>
            </Link>
          } else {
            return <Link className='button is-primary' to={'/manage/users/' + row.uuid}>
              <span className='icon is-small'>
                <i className='fa fa-pencil' />
              </span>
            </Link>
            
          }
        }
      } */
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

  async deleteObject () {
    var url = '/app/groups/' + this.props.group.uuid
    await api.del(url)
    this.props.selectGroup()
  }

  async loadGroupUsers () {
    const body = await api.get(
      '/app/users',
      {
        start: 0,
        limit: 0,
        group: this.props.group.uuid
      }
    )

    this.cursor = tree.select('users')

    this.cursor.set({
      page: 1,
      totalItems: body.total,
      items: body.data,
      pageLength: this.cursor.get('pageLength') || 10
    })
    tree.commit()
  }

  async addToGroup (user) {
    var url = '/app/users/' + user + '/add/group'
    await api.post(url,
      {
        group: this.props.group.uuid
      }
    )

    this.updateUsersToAsign()
    this.loadGroupUsers()
    this.hideModalList()
  }

  async updateUsersToAsign () {
    const cursor = tree.get('usersAsign')
    const updateUsers = await api.get(
      '/app/users',
      {groupAsign: this.props.group.uuid, organization: this.state.group.organization.uuid}
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
              Agregar
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

  async getSalesCenters () {
    let url = '/app/salesCenters/'
    let res = await api.get(url, {
      start: 0,
      limit: 0,
      group: this.props.group.uuid
    })
    this.setState({
      salesCenters: res.data
    })
  }

  async getChannels () {
    let url = '/app/channels/'
    let res = await api.get(url, {
      start: 0,
      limit: 0,
      group: this.props.group.uuid
    })
    this.setState({
      channels: res.data
    })
  }

  render () {
    if (this.state.notFound) {
      return <NotFound msg='este grupo' />
    }

    const { group } = this.state

    if (!group.uuid) {
      return <Loader />
    }
    var deleteButton
    if (currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2') {
      deleteButton =
        <div className='columns'>
          <div className='column has-text-right'>
            <div className='field is-grouped is-grouped-right'>
              <div className='control'>
                <DeleteButton
                  titleButton={'Eliminar'}
                  objectName='Grupo'
                  objectDelete={this.deleteObject.bind(this)}
                  message={`¿Está seguro que desea eliminar el grupo ${group.name}?`}
                    />
              </div>
            </div>
          </div>
        </div>
    }
    return (
      <div className='detail-page'>
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
                    path: '/manage/groups',
                    label: 'Grupos',
                    current: true
                  },
                  {
                    path: '/manage/groups',
                    label: 'Detalle',
                    current: true
                  },
                  {
                    path: '/manage/groups/',
                    label: group.name,
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
              {deleteButton}
            </div>
          </div>
        </div>

        <div className='section is-paddingless-top pad-sides'>

          <div className='columns'>
            <div className='column'>
              <div className='card'>
                <header className='card-header'>
                  <p className='card-header-title'>
                      Detalle
                  </p>
                </header>
                <div className='card-content'>
                  <div className='columns'>
                    <div className='column'>
                      <GroupForm
                        baseUrl='/app/groups'
                        url={'/app/groups/' + this.props.group.uuid}
                        initialState={{...this.state.group, organization: this.state.group.organization._id}}
                        load={this.load.bind(this)}
                        submitHandler={(data) => this.submitHandler(data)}
                        errorHandler={(data) => this.errorHandler(data)}
                        finishUp={(data) => this.finishUpHandler(data)}
                        canEdit={currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2'}
                        canCreate={currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2'}
                      >
                        
                        {
                          this.state.catalogItems &&
                          this.state.catalogItems.length > 0 &&
                          this.state.catalogItems.map(item => {
                            return (
                              <div className='has-20-margin-top' key={item.type}>
                                <p className='label'>{item.type}</p>
                                <div className='tags'>
                                  {item.objects.map((obj) => {
                                    return (
                                      <Link className='tag is-capitalized'
                                        key={obj.uuid}
                                        to={'/catalogs/' + obj.type + '/' + obj.uuid}>
                                        {obj.name}
                                      </Link>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })
                          
                        }
                        {currentRole !== 'consultor-level-2' &&
                        <div className='field is-grouped has-20-margin-top'>
                          <div className='control'>
                            <button
                              className={'button is-primary ' + this.state.isLoading}
                              disabled={!!this.state.isLoading}
                              type='submit'
                              >Guardar</button>
                          </div>
                        </div>
                        }
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
                  {currentRole !== 'consultor-level-2' &&
                  
                  <div className='card-header-select'>
                    <button className='button is-primary' onClick={() => this.showModalList()}>
                        Agregar
                      </button>
                    <BaseModal
                      title='Usuarios para asignar'
                      className={this.state.classNameList}
                      finishUp={this.finishUpList.bind(this)}
                      hideModal={this.hideModalList.bind(this)}
                         >
                      <BranchedPaginatedTable
                        branchName='usersAsign'
                        baseUrl='/app/users'
                        columns={this.getColumnsUsersToAsign()}
                        filters={{groupAsign: this.props.group.uuid, organization: group.organization.uuid}}
                         />
                    </BaseModal>

                  </div>
                  }
                  {currentRole !== 'consultor-level-2' &&

                  <div className='card-header-select'>
                    <button className='button is-primary' onClick={() => this.showModal()}>
                        Nuevo usuario
                      </button>
                    <CreateUser
                      className={this.state.className}
                      finishUp={this.finishUp.bind(this)}
                      hideModal={this.hideModal.bind(this)}
                      branchName='users'
                      baseUrl='/app/users'
                      url='/app/users/'
                      filters={{group: this.props.group.uuid}}
                      organization={group.organization._id}
                      />
                  </div>
                  }
                </header>
                <div className='card-content'>
                  <div className='columns'>
                    <div className='column'>
                      <BranchedPaginatedTable
                        branchName='users'
                        baseUrl='/app/users'
                        columns={this.getColumns()}
                        filters={{group: this.props.group.uuid}}
                         />
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

export default GroupDetail
/* GroupDetail.contextTypes = {
  tree: PropTypes.baobab
}

const branchedGroupDetail = branch({groups: 'groups'}, GroupDetail)

export default Page({
  path: '/manage/groups/:uuid',
  title: 'Detalles de grupo',
  exact: true,
  roles: 'admin, orgadmin, analyst, consultor-level-3, consultor-level-2, manager-level-2, manager-level-3',
  validate: [loggedIn, verifyRole],
  component: branchedGroupDetail
}) */
