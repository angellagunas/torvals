import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import api from '~base/api'
import DeleteButton from '~base/components/base-deleteButton'
import tree from '~core/tree'
import UserDetail from './detail'
import CreateUser from './create'
import { testRoles } from '~base/tools'

class UsersDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      searchTerm: '',
      userSelected: tree.get('userDetail') || undefined,
      modalClassName: '',
      canCreate: 'admin, orgadmin, analyst, manager-level-2, manager-level-3'
    }
  }
  getColumns () {
    return [
      {
        'title': 'Nombre', //TODO: translate
        'property': 'name',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Email', //TODO: translate
        'property': 'email',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Rol', //TODO: translate
        'property': 'role',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Grupos', //TODO: translate
        'property': 'groups',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (row.groups.length > 2) {
            return (
              <div>
                {row.groups[0].name}
                <br />
                {row.groups[1].name}
                <br />
                {row.groups.length - 2} <FormattedMessage
                  id="user.detailMore"
                  defaultMessage={`más`}
                />
              </div>
            )
          } else if (row.groups.length > 1) {
            return (
              <div>
                {row.groups[0].name}
                <br />
                {row.groups[1].name}
              </div>
            )
          } else if (row.groups.length > 0) {
            return (
              <div>
                {row.groups[0].name}
              </div>
            )
          }
        }
      },
      {
        'title': 'Acciones', //TODO: translate
        formatter: (row) => {
          const deleteObject = async function () {
            var url = '/app/users/' + row.uuid
            await api.del(url)

            const cursor = tree.get('users-list')
            const users = await api.get('/app/users/')

            tree.set('users-list', {
              page: cursor.page,
              totalItems: users.total,
              items: users.data,
              pageLength: cursor.pageLength
            })
            tree.commit()
            await updateStep()
            
          }

          const updateStep = async function () {
            try {
              let user = tree.get('user')
              if (user.currentOrganization.wizardSteps.users) {
                return
              }
              let url = '/app/organizations/' + user.currentOrganization.uuid + '/step'

              let res = await api.post(url, {
                step: {
                  name: 'users',
                  value: true
                }
              })

              if (res) {
                let me = await api.get('/user/me')
                tree.set('user', me.user)
                tree.set('organization', me.user.currentOrganization)
                tree.set('rule', me.rule)
                tree.set('role', me.user.currentRole)
                tree.set('loggedIn', me.loggedIn)
                tree.commit()
                return true
              } else {
                return false
              }
            } catch (e) {
              console.log(e)
              return false
            }
          }


          const currentUser = tree.get('user')
          var disabledActions = false

          if (row.roleDetail && currentUser) {
            disabledActions = row.roleDetail.priority <= currentUser.currentRole.priority
          }

          if (currentUser.currentRole.slug === 'consultor-level-3') {
            disabledActions = true
          }

          if (currentUser.currentRole.slug === 'orgadmin') {
            disabledActions = false
          }

          return (
            <div className='field is-grouped'>
              <div className='control'>
                {disabledActions
                ? <a className='button is-primary' onClick={() => this.selectUser(row)}>
                  <span className='icon is-small' title='Visualizar'>
                    <i className='fa fa-eye' />
                  </span>
                </a>
                  : <a className='button is-primary' onClick={() => this.selectUser(row)}>
                    <span className='icon is-small' title='Editar'>
                      <i className='fa fa-pencil' />
                    </span>
                  </a>
              }
              </div>
              <div className='control'>
                {currentUser.uuid !== row.uuid && !disabledActions && (
                <DeleteButton
                  iconOnly
                  icon='fa fa-trash'
                  objectName='Usuario'
                  objectDelete={deleteObject}
                  //TODO: translate
                  message={`¿Está seguro de querer desactivar a ${row.name} ?`}
                />
              )}
              </div>
            </div>
          )
        }
      }
    ]
  }

  searchOnChange (e) {
    let value = e.target.value
    this.setState({
      searchTerm: value
    })
  }

  selectUser (user) {
    tree.set('userDetail', user)
    tree.commit()
    this.setState({
      userSelected: user
    })
  }

  showModal () {
    this.setState({
      modalClassName: ' is-active'
    })
  }

  hideModal (e) {
    this.setState({
      modalClassName: ''
    })
  }

  finishUp (object) {
    this.setState({
      modalClassName: ''
    })

    this.selectUser(object)
  }

  render () {
    return (
      <div className=''>
        {!this.state.userSelected &&
        <div>
          <div className='section level has-10-margin-top'>
            <div className='level-left'>
              <div className='level-item'>
                <h1 className='title is-5'>
                  <FormattedMessage
                    id="user.detailTitle"
                    defaultMessage={`Visualiza tus usuarios`}
                  />
                </h1>
              </div>
            </div>
            <div className='level-right'>
              <div className='level-item'>
                <div className='field'>
                  <div className='control has-icons-right'>
                    <input
                      className='input input-search'
                      type='text'
                      value={this.state.searchTerm}
                      onChange={(e) => { this.searchOnChange(e) }} placeholder='Buscar' />

                    <span className='icon is-small is-right'>
                      <i className='fa fa-search fa-xs' />
                    </span>
                  </div>
                </div>
              </div>
              {testRoles(this.state.canCreate) &&
              <div className='level-item'>
                <a
                  className='button is-info is-pulled-right'
                  onClick={() => this.showModal()}
                >
                  <span>
                    <FormattedMessage
                      id="user.detailBtnNew"
                      defaultMessage={`Nuevo Usuario`}
                    />
                  </span>
                </a>
              </div>
              }
            </div>
          </div>
          <div className='list-page'>
            <BranchedPaginatedTable
              branchName='users-list'
              baseUrl='/app/users/'
              columns={this.getColumns()}
              filters={{ general: this.state.searchTerm }}
            />
          </div>

          <CreateUser
            branchName='users-list'
            url='/app/users'
            className={this.state.modalClassName}
            hideModal={() => this.hideModal()}
            finishUp={(obj) => this.finishUp(obj)}
            />
        </div>
      }
        {this.state.userSelected &&
          <div>
            <UserDetail user={this.state.userSelected} selectUser={() => { this.selectUser() }} />
          </div>

        }
      </div>
    )
  }
}

export default UsersDetail
