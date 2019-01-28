import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import moment from 'moment'

class GroupsDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      searchTerm: ''
    }
  }

  getColumns () {
    return [
        {
          'title': 'Prioridad',
          'property': 'priority',
          'default': 'N/A',
          'sortable': true
        },
        {
          'title': 'Nombre',
          'property': 'name',
          'default': 'N/A',
          'sortable': true
        },
        {
          'title': 'Creado',
          'property': 'dateCreated',
          'default': 'N/A',
          'sortable': true,
          formatter: (row) => {
            return (
              moment.utc(row.dateCreated).local().format('DD/MM/YYYY hh:mm a')
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

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }

  render () {
    return (
        <div>
            <div className='section level has-10-margin-top'>
        <div className='level-left'>
            <div className='level-item'>
            <h1 className='title is-5'>
                <FormattedMessage
                id='Visualiza los Roles'
                defaultMessage={`Visualiza los Roles`}
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
        </div>
        </div>
            <div className='list-page'>
                <BranchedPaginatedTable
                    branchName='roles'
                    baseUrl='/app/roles/'
                    columns={this.getColumns()}
                    filters={{ general: this.state.searchTerm }}
                />
            </div>
        </div>
    )
  }
}

export default injectIntl(GroupsDetail)
