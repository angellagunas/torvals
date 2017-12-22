import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import moment from 'moment'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import CreateProject from './create'
import BaseFilterPanel from '~base/components/base-filters'
import FontAwesome from 'react-fontawesome'

const schema = {
  type: 'object',
  required: [],
  properties: {
    name: {type: 'text', title: 'Por nombre'}
  }
}

const uiSchema = {
  name: {'ui:widget': 'SearchFilter'}
}

class Projects extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: '',
      orgs: [],
      filters: {}
    }

    this.toggleFilterPanel = this.toggleFilterPanel.bind(this)
    this.handleOnFilter = this.handleOnFilter.bind(this)
  }

  componentWillMount () {
    this.context.tree.set('projects', {
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
            <Link to={'/projects/' + row.uuid}>
              {row.name}
            </Link>
          )
        }
      },
      {
        'title': 'Created',
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
        'title': 'Actions',
        formatter: (row) => {
          return <Link className='button' to={'/projects/' + row.uuid}>
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
    this.props.history.push('/projects/' + object.uuid)
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
            <h1 className='is-size-3 is-padding-top-small is-padding-bottom-small'>Projects</h1>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                    Projects
                </p>
                <div className='card-header-select'>
                  <button className='button is-primary' onClick={() => this.showModal()}>
                    New Project
                  </button>
                  <CreateProject
                    className={this.state.className}
                    hideModal={this.hideModal.bind(this)}
                    finishUp={this.finishUp.bind(this)}
                    branchName='projects'
                    baseUrl='/app/projects'
                    url='/app/projects'
                  />

                </div>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BranchedPaginatedTable
                      branchName='projects'
                      baseUrl='/app/projects'
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

Projects.contextTypes = {
  tree: PropTypes.baobab
}

const branchedProjects = branch({projects: 'projects'}, Projects)

export default Page({
  path: '/projects',
  title: 'Projects',
  icon: 'cog',
  exact: true,
  roles: 'supervisor, analista, admin-organizacion, admin',
  validate: [loggedIn, verifyRole],
  component: branchedProjects
})
