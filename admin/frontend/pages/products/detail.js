import React, { Component } from 'react'
import api from '~base/api'
import moment from 'moment'
import Link from '~base/router/link'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ProductForm from './create-form'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
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
      isLoading: ''
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = '/admin/products/' + this.props.match.params.uuid
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
    var url = '/admin/products/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/catalogs/products')
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
            <Link className='button' to={'/forecasts/detail/' + row.uuid}>
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
    if (this.state.notFound) {
      return <NotFound msg='este producto' />
    }
    const { product } = this.state

    if (!this.state.loaded) {
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
                  path: '/admin/catalogs/products',
                  label: 'Productos Activos',
                  current: false
                },
                {
                  path: '/admin/catalogs/products/detail/',
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
                    <DeleteButton
                      titleButton={'Eliminar'}
                      objectName='Producto'
                      objectDelete={this.deleteObject.bind(this)}
                      message={`¿Estas seguro de eliminar el producto ${product.name}?`}
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
                      Productos
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <ProductForm
                          baseUrl='/admin/products'
                          url={'/admin/products/' + this.props.match.params.uuid}
                          initialState={product}
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
                        </ProductForm>
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
  path: '/catalogs/products/detail/:uuid',
  title: 'Product detail',
  exact: true,
  validate: loggedIn,
  component: ProductDetail
})
