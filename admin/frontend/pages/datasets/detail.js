import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import FontAwesome from 'react-fontawesome'

import CreateDatasetForm from './create-form'
import UploadDataset from './upload'

class DataSetDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      dataset: {},
      organizations: []
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
    this.load()
    this.loadOrgs()
  }

  async load () {
    var url = '/admin/datasets/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      dataset: body.data
    })
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
      organizations: body.data
    })
  }

  getColumns () {
    return [
      {
        'title': 'Name',
        'property': 'name',
        'default': 'N/A'
      },
      {
        'title': 'Email',
        'property': 'email',
        'default': 'N/A'
      },
      {
        'title': 'Actions',
        formatter: (row) => {
          return <Link className='button' to={'/manage/users/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }

  async deleteOnClick () {
    var url = '/admin/datasets/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/datasets')
  }

  getUpload () {
    let dataset = this.state.dataset
    if (!dataset.fileChunk || (dataset.fileChunk && !dataset.fileChunk.recreated)) {
      return (
        <div className='column'>
          <UploadDataset
            query={{dataset: this.state.dataset.uuid}}
            load={() => { this.load() }}
          />
        </div>
      )
    }

    if (dataset.status === 'preprocessing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                File uploaded
              </p>
            </header>
            <div className='card-content'>
              <div className='message is-success'>
                <div className='message-body is-large has-text-centered'>
                  <div className='columns'>
                    <div className='column'>
                      <span className='icon has-text-success is-large'>
                        <FontAwesome className='fa-3x' name='check-square-o' />
                      </span>
                    </div>
                  </div>
                  <div className='columns'>
                    <div className='column'>
                      File {dataset.fileChunk.filename} is being preprocessed
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

  render () {
    const { dataset } = this.state

    if (!dataset.uuid) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <button
                      className='button is-danger'
                      type='button'
                      onClick={() => this.deleteOnClick()}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Dataset
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <CreateDatasetForm
                          baseUrl='/admin/datasets'
                          url={'/admin/datasets/' + this.props.match.params.uuid}
                          initialState={{
                            name: this.state.dataset.name,
                            description: this.state.dataset.description,
                            organization: this.state.dataset.organization.uuid
                          }}
                          load={this.load.bind(this)}
                          organizations={this.state.organizations || []}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button className='button is-primary'>Save</button>
                            </div>
                          </div>
                        </CreateDatasetForm>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {this.getUpload()}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

DataSetDetail.contextTypes = {
  tree: PropTypes.baobab
}

export default branch({datasets: 'datasets'}, DataSetDetail)
