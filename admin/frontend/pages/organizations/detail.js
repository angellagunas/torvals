import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'

import DeleteButton from '~base/components/base-deleteButton'
import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import OrganizationForm from './form'

class OrganizationDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      organization: {},
      isLoading: ''
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
    if (this.props.hasOwnProperty('test')) {
      this.props.test()
    }
  }

  async load () {
    var url = '/admin/organizations/' + this.props.match.params.uuid
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
          return <Link className='button' to={'/manage/users/' + row.uuid}>
            Detalle
          </Link>
        }
      }
    ]
  }

  async deleteObject () {
    var url = '/admin/organizations/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/manage/organizations')
  }

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  finishUpHandler () {
    this.setState({ isLoading: '' })
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
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <DeleteButton
                      objectName='Organization'
                      objectDelete={this.deleteObject.bind(this)}
                      message={`Estas seguro de querer eliminar la organización ${organization.name}?`}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Organización
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <OrganizationForm
                          baseUrl='/admin/organizations'
                          url={'/admin/organizations/' + this.props.match.params.uuid}
                          initialState={this.state.organization}
                          load={this.load.bind(this)}
                          submitHandler={(data) => this.submitHandler(data)}
                          errorHandler={(data) => this.errorHandler(data)}
                          finishUp={(data) => this.finishUpHandler(data)}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button
                                className={'button is-primary ' + this.state.isLoading}
                                disabled={!!this.state.isLoading}
                                type='submit'
                              >Guardar</button>
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
                      Usuarios
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <BranchedPaginatedTable
                          branchName='users'
                          baseUrl='/admin/users'
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

const branchedOrganizationDetail = branch({organizations: 'organizations'}, OrganizationDetail)

export default Page({
  path: '/manage/organizations/:uuid',
  title: 'User details',
  exact: true,
  validate: loggedIn,
  component: branchedOrganizationDetail
})
