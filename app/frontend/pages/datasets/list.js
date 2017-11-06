import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'

import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import CreateDataSet from './create'

class DataSets extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: ''
    }
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
        'default': 'new'
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
                <div className='card-header-select'>
                  <button className='button is-primary' onClick={() => this.showModal()}>
                    New DataSet
                  </button>
                  <CreateDataSet
                    className={this.state.className}
                    hideModal={this.hideModal.bind(this)}
                    finishUp={this.finishUp.bind(this)}
                    branchName='datasets'
                    baseUrl='/app/datasets'
                    url='/app/datasets'
                  />

                </div>
              </header>
              <div className='card-content'>
                <div className='columns'>
                  <div className='column'>
                    <BranchedPaginatedTable
                      branchName='datasets'
                      baseUrl='/app/datasets'
                      columns={this.getColumns()}
                       />
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

DataSets.contextTypes = {
  tree: PropTypes.baobab
}

export default branch({datasets: 'datasets'}, DataSets)

// export default DataSets;
