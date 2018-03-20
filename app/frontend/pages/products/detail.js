import React, { Component } from 'react'
import api from '~base/api'
import moment from 'moment'
import Link from '~base/router/link'
import { testRoles } from '~base/tools'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ProductForm from './create-form'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import DeleteButton from '~base/components/base-deleteButton'
import Breadcrumb from '~base/components/base-breadcrumb'
import NotFound from '~base/components/not-found'

class ProductDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      product: {},
      roles: 'admin, orgadmin, analyst, manager-level-2',
      canEdit: false,
      isLoading: ''
    }
  }

  componentWillMount () {
    this.load()
    this.setState({canEdit: testRoles(this.state.roles)})
  }

  async load () {
    var url = '/app/products/' + this.props.match.params.uuid

    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        product: body.data
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  async deleteObject () {
    var url = '/app/products/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/products')
  }

  getColumns () {
    return [
      {
        'title': 'Estado',
        'property': 'status',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Fecha Inicial',
        'property': 'dateStart',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateStart).local().format('DD/MM/YYYY')
          )
        }
      },
      {
        'title': 'Fecha Final',
        'property': 'dateEnd',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          return (
            moment.utc(row.dateEnd).local().format('DD/MM/YYYY')
          )
        }
      },
      {
        'title': 'Acciones',
        formatter: (row) => {
          return (
            <Link className='button' to={'/forecasts/' + row.uuid}>
              Detalle
            </Link>
          )
        }
      }
    ]
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
    let { loading, canEdit, product } = this.state
    if (loading) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section is-paddingless-top pad-sides'>
            <Breadcrumb
              path={[
                {
                  path: '/',
                  label: 'Inicio',
                  current: false
                },
                {
                  path: '/products',
                  label: 'Productos',
                  current: false
                },
                {
                  path: '/products/detail/',
                  label: 'Detalle',
                  current: true
                },
                {
                  path: '/products/detail/',
                  label: product.name,
                  current: true
                }
              ]}
              align='left'
            />
            <div className='columns'>
              <div className='column has-text-right'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    { canEdit &&
                      <DeleteButton
                        titleButton={'Eliminar'}
                        objectName='Producto'
                        objectDelete={this.deleteObject.bind(this)}
                        message={`¿Eliminar el producto ${this.state.product.name}?`}
                      />
                    }
                  </div>
                </div>
              </div>
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Producto
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <ProductForm
                          baseUrl='/app/products'
                          url={'/app/products/' + this.props.match.params.uuid}
                          initialState={this.state.product}
                          load={this.load.bind(this)}
                          canEdit={canEdit}
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
                        </ProductForm>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='column'>
                <div className='columns'>
                  <div className='column'>
                    <div className='card'>
                      <header className='card-header'>
                        <p className='card-header-title'>
                          Predicción
                        </p>
                      </header>
                      <div className='card-content'>
                        <div className='columns'>
                          <div className='column'>
                            <BranchedPaginatedTable
                              branchName='forecasts'
                              baseUrl='/app/forecasts/'
                              columns={this.getColumns()}
                              filters={{product: this.state.product.uuid}}
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
        </div>
      </div>
    )
  }
}

export default Page({
  path: '/products/:uuid',
  title: 'Product detail',
  exact: true,
  roles: 'analyst, orgadmin, admin, manager-level-1, manager-level-2, manager-level-3',
  validate: [loggedIn, verifyRole],
  component: ProductDetail
})
