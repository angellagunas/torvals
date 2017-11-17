import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'

import Loader from '~base/components/spinner'
import ProductForm from './create-form'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'

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
    var url = '/admin/products/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      product: body.data
    })
  }

  async deleteOnClick () {
    var url = '/admin/products/' + this.props.match.params.uuid
    const body = await api.del(url)
    this.props.history.push('/admin/products')
  }

  getDeleteButton () {
    return (
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
    )

    return null
  }

  render () {
    const { product } = this.state.product

    if (!this.state.loaded) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns'>
              {this.getDeleteButton()}
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
                          baseUrl='/admin/products'
                          url={'/admin/products/' + this.props.match.params.uuid}
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
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default ProductDetail
