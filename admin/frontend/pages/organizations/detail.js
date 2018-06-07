import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'

import DeleteButton from '~base/components/base-deleteButton'
import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import OrganizationForm from './form'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'

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
    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        organization: body.data
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
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
        'title': 'Acciones',
        formatter: (row) => {
          return <Link className='button is-primary' to={'/manage/users/' + row.uuid}>
            <span className='icon is-small' title='Editar'>
              <i className='fa fa-pencil' />
            </span>
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
    if (this.state.notFound) {
      return <NotFound msg='esta organización' />
    }

    const { organization } = this.state

    if (!organization.uuid) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top pad-sides'>
            <Breadcrumb
              path={[
                {
                  path: '/admin',
                  label: 'Inicio',
                  current: false
                },
                {
                  path: '/admin/manage/organizations',
                  label: 'Organizaciones',
                  current: false
                },
                {
                  path: '/admin/manage/organizations',
                  label: organization.name,
                  current: true
                }
              ]}
              align='left'
            />
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <DeleteButton
                      objectName='Organization'
                      objectDelete={this.deleteObject.bind(this)}
                      message={`¿Estas seguro de querer eliminar la organización ${organization.name}?`}
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
