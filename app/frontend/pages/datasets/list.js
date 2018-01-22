import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import BaseFilterPanel from '~base/components/base-filters'
import FontAwesome from 'react-fontawesome'

const schema = {
  type: 'object',
  required: [],
  properties: {
    name: {type: 'text', title: 'Por nombre'},
    status: {
      type: 'text',
      title: 'Por status',
      values: [
        {
          name: 'new',
          uuid: 'new'
        },
        {
          name: 'uploading',
          uuid: 'uploading'
        },
        {
          name: 'uploaded',
          uuid: 'uploaded'
        },
        {
          name: 'preprocessing',
          uuid: 'preprocessing'
        },
        {
          name: 'configuring',
          uuid: 'configuring'
        },
        {
          name: 'processing',
          uuid: 'processing'
        },
        {
          name: 'reviewing',
          uuid: 'reviewing'
        },
        {
          name: 'ready',
          uuid: 'ready'
        }
      ]
    }
  }
}

const uiSchema = {
  name: {'ui:widget': 'SearchFilter'},
  status: {'ui:widget': 'SelectSearchFilter'}
}

class DataSets extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: '',
      filters: {}
    }

    this.toggleFilterPanel = this.toggleFilterPanel.bind(this)
    this.handleOnFilter = this.handleOnFilter.bind(this)
  }

  componentWillMount () {
    this.context.tree.set('datasets', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10
    })
    this.context.tree.commit()
  }

  getColumns () {
    return [
      {
        'title': 'Name',
        'property': 'name',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            <Link to={'/datasets/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Status',
        'property': 'status',
        'default': 'new',
        'sortable': true
      },
      {
        'title': 'Actions',
        formatter: (row) => {
          return <Link className='button' to={'/datasets/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }

  toggleFilterPanel (isFilterOpen) {
    this.setState({isFilterOpen: !isFilterOpen})
  }

  handleOnFilter (formData) {
    let filters = {}

    for (var field in formData) {
      if (formData[field]) {
        filters[field] = formData[field]
      }
    }
    this.setState({filters})
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
    this.props.history.push('/datasets/' + object.uuid)
  }

  render () {
    let { isFilterOpen, filters } = this.state
    let filterPanel

    if (isFilterOpen) {
      filterPanel = (
        <div className='column is-narrow side-filters is-paddingless'>
          <BaseFilterPanel
            schema={schema}
            uiSchema={uiSchema}
            filters={filters}
            onFilter={this.handleOnFilter}
            onToggle={() => this.toggleFilterPanel(isFilterOpen)} />
        </div>
      )
    }

    if (!isFilterOpen) {
      filterPanel = (<div className='searchbox'>
        <a
          href='javascript:void(0)'
          className='card-header-icon has-text-white'
          aria-label='more options'
          onClick={() => this.toggleFilterPanel(isFilterOpen)}
        >
          <FontAwesome name='search' />
        </a>
      </div>)
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top'>
            <h1 className='is-size-3 is-padding-top-small is-padding-bottom-small'>DataSets</h1>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                    DataSets
                </p>
                
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BranchedPaginatedTable
                      branchName='datasets'
                      baseUrl='/app/datasets'
                      columns={this.getColumns()}
                      filters={this.state.filters}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        { filterPanel }
      </div>
    )
  }
}

DataSets.contextTypes = {
  tree: PropTypes.baobab
}

const branchedDataSets = branch({datasets: 'datasets'}, DataSets)

export default Page({
  path: '/datasets',
  title: 'Datasets',
  icon: 'check',
  exact: true,
  roles: 'enterprisemanager, analyst, orgadmin, admin',
  validate: [loggedIn, verifyRole],
  component: branchedDataSets
})
