import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'

import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import OrganizationForm from './form'

class OrganizationDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      organization: {}
    }
  }

  componentWillMount () {
    this.context.tree.set('organizations', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10
    })
    this.context.tree.commit()
    this.load()
  }

  async load () {
    var url = '/app/organizations/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      organization: body.data
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

  render () {
    const { organization } = this.state

    if (!organization.uuid) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Organization
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <OrganizationForm
                          baseUrl='/app/organizations'
                          url={'/app/organizations/' + this.props.match.params.uuid}
                          initialState={this.state.organization}
                          load={this.load.bind(this)}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button className='button is-primary'>Save</button>
                            </div>
                          </div>
                        </OrganizationForm>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Users
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <BranchedPaginatedTable
                          branchName='users'
                          baseUrl='/app/users'
                          columns={this.getColumns()}
                          filters={{organization: this.props.match.params.uuid}}
                         />
                      </div>
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

OrganizationDetail.contextTypes = {
  tree: PropTypes.baobab
}

export default branch({organizations: 'organizations'}, OrganizationDetail)
  