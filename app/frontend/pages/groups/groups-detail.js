import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import api from '~base/api'
import DeleteButton from '~base/components/base-deleteButton'
import tree from '~core/tree'
import GroupDetail from './detail'
import CreateGroup from './create'
import moment from 'moment'
import GroupUsers from './group-users'
import { testRoles } from '~base/tools'

class GroupsDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      searchTerm: '',
      groupSelected: undefined,
      modalClassName: '',
      canCreate: 'admin, orgadmin, analyst, manager-level-2, manager-level-3'
    }
  }

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }

  getColumns () {
    return [
      {
        'title': this.formatTitle('groups.formName'),
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
              row.name
          )
        }
      },
      {
        'title': this.formatTitle('groups.tableCreated'),
        'property': 'dateCreated',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
              moment.utc(row.dateCreated).local().format('DD/MM/YYYY hh:mm a')
          )
        }
      },
      {
        'title': this.formatTitle('groups.tableMembers'),
        'property': 'users',
        'default': '0',
        'sortable': true,
        formatter: (row) => {
          return (
            <div>
              {row.users.length}
              {row.users.length > 0 && <GroupUsers changeTab={(tab) => this.props.changeTab(tab)} group={row} />}
            </div>
          )
        }
      },
      {
        'title': this.formatTitle('groups.tableActions'),
        formatter: (row) => {
          const deleteObject = async function () {
            var url = '/app/groups/' + row.uuid
            await api.del(url)

            const cursor = tree.get('groups')
            const users = await api.get('/app/groups/')

            tree.set('groups', {
              page: cursor.page,
              totalItems: users.total,
              items: users.data,
              pageLength: cursor.pageLength
            })
            tree.commit()
          }

          var currentRole = tree.get('user').currentRole.slug
          var deleteButton
          if (currentRole !== 'consultor-level-3' && currentRole !== 'consultor-level-2') {
            deleteButton =
              <div className='control'>
                <DeleteButton
                  iconOnly
                  icon='fa fa-trash'
                  objectName={this.formatTitle('groups.deleteTitle')}
                  objectDelete={deleteObject}
                  message={`${this.formatTitle('groups.deleteMsg')} ${row.name} ?`}
                />
              </div>
          }

          return (
            <div className='field is-grouped'>
              <div className='control'>
                <a className='button is-primary' onClick={() => { this.selectGroup(row) }}>
                  <span className='icon is-small' title='Editar'>
                    <i className={currentRole === 'consultor-level-3' || currentRole === 'consultor-level-2'
                        ? 'fa fa-eye' : 'fa fa-pencil'} />
                  </span>
                </a>
              </div>
              {deleteButton}
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

  selectGroup (user) {
    this.setState({
      groupSelected: user
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

    this.selectGroup(object)
  }

  render () {
    return (
      <div className=''>
        {!this.state.groupSelected &&
        <div>
          <div className='section level has-10-margin-top'>
            <div className='level-left'>
              <div className='level-item'>
                <h1 className='title is-5'>
                  <FormattedMessage
                    id='groups.title'
                    defaultMessage={`Visualiza tus grupos`}
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
                      onChange={(e) => { this.searchOnChange(e) }}
                      placeholder={this.formatTitle('dashboard.searchText')}
                    />

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
                      id='groups.btnNew'
                      defaultMessage={`Nuevo Grupo`}
                    />
                  </span>
                </a>
              </div>
              }
            </div>
          </div>
          <div className='list-page'>
            <BranchedPaginatedTable
              branchName='groups'
              baseUrl='/app/groups/'
              columns={this.getColumns()}
              filters={{ general: this.state.searchTerm }}
            />
          </div>

          <CreateGroup
            branchName='groups'
            url='/app/groups'
            className={this.state.modalClassName}
            hideModal={() => this.hideModal()}
            finishUp={(obj) => this.finishUp(obj)}
            canCreate={this.state.canCreate}
            selectGroup={() => { this.selectGroup() }}
          />
        </div>
      }
        {this.state.groupSelected &&
          <div>
            <GroupDetail
              group={this.state.groupSelected}
              selectGroup={() => { this.selectGroup() }}
            />
          </div>

        }
      </div>
    )
  }
}

export default injectIntl(GroupsDetail)
