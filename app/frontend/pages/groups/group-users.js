import React, { Component } from 'react'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import BaseModal from '~base/components/base-modal'
import Link from '~base/router/link'
import api from '~base/api'
import tree from '~core/tree'

class GroupUsers extends Component {
  constructor (props) {
    super(props)
    this.state = {
      classNameList: ''
    }
    this.currentRole = tree.get('user').currentRole.slug
  }

  selectUser(user) {
    tree.set('userDetail', user)
    tree.commit()
    this.props.changeTab('users')
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
          return <button className='button is-primary' onClick={() => this.selectUser(row)} >
                  <span className='icon is-small'>
                    <i className={this.currentRole === 'consultor-level-3' || this.currentRole === 'consultor-level-2'
                ? 'fa fa-eye' : 'fa fa-pencil'} />
                  </span>
                </button>
        }
      }
    ]
  }

  showModalList = () => {
    this.setState({
      classNameList: ' is-active'
    })
  }

  hideModalList () {
    this.setState({
      classNameList: ''
    })
  }

  async loadGroupUsers (e, group) {
    const body = await api.get(
      '/app/users',
      {
        start: 0,
        limit: 0,
        group: group.uuid
      }
    )
    const cursor = tree.get('users')

    tree.set('users', {
      page: cursor.page,
      totalItems: body.total,
      items: body.data,
      pageLength: cursor.pageLength
    })
    tree.commit()

    this.showModalList()
  }

  render () {
    return (
      <div>
        <a className='is-link' onClick={(e) => { this.loadGroupUsers(e, this.props.group) }}>Ver lista</a>
        <BaseModal
          title={'Usuarios grupo ' + this.props.group.name}
          className={this.state.classNameList}
          hideModal={this.hideModalList.bind(this)}
        >
          <BranchedPaginatedTable
            branchName='users'
            baseUrl='/app/users'
            columns={this.getColumns()}
            filters={{ group: this.props.group.uuid }}
          />
        </BaseModal>
      </div>
    )
  }
}

export default GroupUsers
