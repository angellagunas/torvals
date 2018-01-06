import React, { Component } from 'react'
import api from '~base/api'
import moment from 'moment'
import Link from '~base/router/link'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import Loader from '~base/components/spinner'
import ProductForm from './create-form'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'
import DeleteButton from '~base/components/base-deleteButton'

class ProductDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      product: {}
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = '/app/products/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      product: body.data
    })
  }

  async deleteObject () {
    var url = '/app/products/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/products')
  }

  getColumns () {
    return [
      {
        'title': 'Status',
        'property': 'status',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': 'Start date',
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
        'title': 'End date',
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
        'title': 'Actions',
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

  render () {
    if (this.state.loading) {
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
                      titleButton={'Delete'}
                      objectName='Product'
                      objectDelete={this.deleteObject.bind(this)}
                      message={`Are you sure you want to delete the product ${this.state.product.name}?`}
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
                      Product
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
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button className='button is-primary'>Save</button>
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
                          Forecasts
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
  roles: 'supervisor, analista, admin-organizacion, admin, ops, supervisor-ops',
  validate: [loggedIn, verifyRole],
  component: ProductDetail
})
