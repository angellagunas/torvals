import React, { Component } from 'react'
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
      userSelected: undefined,
      modalClassName: '',
      canCreate: 'admin, orgadmin, analyst, manager-level-2, manager-level-3'
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
        'title': 'Rol',
        'property': 'role',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Grupos',
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
                {row.groups.length - 2} más
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
        'title': 'Acciones',
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
                <h1 className='title is-5'>Visualiza tus usuarios</h1>
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
                  onClick={() => this.showModal()}>
                  <span>Nuevo Usuario</span>
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
