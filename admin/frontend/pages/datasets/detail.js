import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import FontAwesome from 'react-fontawesome'
import classNames from 'classnames'

import Page from '~base/page'
import {loggedIn} from '~base/middlewares/'
import DatasetDetailForm from './detail-form'
import { UploadDataset } from '~base/components/base-uploads'
import ConfigureDatasetForm from './configure-form'
import DeleteButton from '~base/components/base-deleteButton'
import ConfigureViewDataset from './configure-view'
import BaseModal from '~base/components/base-modal'
import ProductForm from './edit-product'
import SalesCenterForm from './edit-salescenter'
import ChannelForm from './edit-channel'

class DataSetDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: '',
      classNameSC: '',
      isProductsOpen: false,
      isSalesCenterOpen: false,
      isChannelsOpen: false,
      loading: true,
      loaded: false,
      dataset: {},
      organizations: [],
      currentProduct: null,
      currentSalesCenter: null,
      currentChannel: null
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

    this.interval = setInterval(() => this.load(), 30000)
  }

  componentWillUnmount () {
    clearInterval(this.interval)
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

  changeHandler (data) {
    this.setState({
      dataset: data
    })
  }

  async deleteObject () {
    var url = '/admin/datasets/' + this.props.match.params.uuid
    await api.del(url)
    this.props.history.push('/admin/datasets')
  }

  async configureOnClick () {
    var url = '/admin/datasets/' + this.props.match.params.uuid + '/set/configure'
    await api.post(url)
    await this.load()
  }

  async consolidateOnClick () {
    var url = '/admin/datasets/' + this.props.match.params.uuid + '/set/conciliate'
    await api.post(url)
    await this.load()
    this.props.history.push(`/admin/projects/detail/${this.state.dataset.project.uuid}`)
  }

  async cancelOnClick () {
    await this.configureOnClick()
  }

  getUpload () {
    let dataset = this.state.dataset
    if (
      (!dataset.fileChunk && dataset.source === 'uploaded') ||
      (dataset.fileChunk && dataset.status === 'uploading')
    ) {
      return (
        <div className='column'>
          <UploadDataset
            query={{dataset: this.state.dataset.uuid}}
            load={() => { this.load() }}
          />
        </div>
      )
    }

    if (dataset.status === 'uploaded') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Archivo cargado
              </p>
            </header>
            <div className='card-content'>
              <div className='message is-success'>
                <div className='message-body is-large has-text-centered'>
                  <div className='columns'>
                    <div className='column'>
                      <span className='icon is-large'>
                        <FontAwesome className='fa-3x fa-spin' name='cog' />
                      </span>
                    </div>
                  </div>
                  <div className='columns'>
                    <div className='column'>
                      El archivo {dataset.fileChunk.filename} ha sido cargado a
                      nuestros servidores y se enviará para preprocesamiento.
                      Favor de regresar en un par de minutos.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'preprocessing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Archivo enviado a preprocesamiento
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
                      El archivo {dataset.fileChunk.filename} se está preprocesando
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'processing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Procesando archivo
              </p>
            </header>
            <div className='card-content'>
              <div className='message is-success'>
                <div className='message-body is-large has-text-centered'>
                  <div className='columns'>
                    <div className='column'>
                      <span className='icon has-text-success is-large'>
                        <FontAwesome className='fa-3x fa-spin' name='cog' />
                      </span>
                    </div>
                  </div>
                  <div className='columns'>
                    <div className='column'>
                      El Dataset se está procesando
                    </div>
                  </div>
                </div>
              </div>
              <div className='columns'>
                <div className='column'>
                  <div className='field is-grouped'>
                    <div className='control'>
                      <button
                        className='button is-black'
                        onClick={e => this.cancelOnClick()}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'configuring') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Configurando el Dataset
              </p>
            </header>
            <div className='card-content'>
              <div className='columns'>
                <div className='column'>
                  <ConfigureDatasetForm
                    initialState={dataset}
                    columns={dataset.columns || []}
                    url={'/admin/datasets/' + dataset.uuid + '/configure'}
                    changeHandler={(data) => this.changeHandler(data)}
                    load={this.load.bind(this)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'reviewing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Revisando el dataset
              </p>
            </header>
            <div className='card-content'>
              <div className='columns'>
                <div className='column'>
                  <div className='field is-grouped'>
                    <b>Fecha mínima:</b> <span style={{paddingLeft: '5px'}}>{dataset.dateMin}</span>
                  </div>
                  <div className='field is-grouped'>
                    <b>Fecha máxima:</b> <span style={{paddingLeft: '5px'}}>{dataset.dateMax}</span>
                  </div>
                  <ConfigureViewDataset
                    initialState={dataset}
                  />
                  <div className='field is-grouped'>
                    <div className='control'>
                      <button
                        className='button is-black'
                        onClick={e => this.configureOnClick()}
                      >
                        Configurar
                      </button>
                    </div>
                    <div className='control'>
                      <button
                        className='button is-primary'
                        onClick={e => this.consolidateOnClick()}
                      >
                        Conciliar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'conciliated') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Dataset conciliado
              </p>
            </header>
            <div className='card-content'>
              <div className='message is-success'>
                <div className='message-body is-large has-text-centered'>
                  <div className='columns'>
                    <div className='column'>
                      <span className='icon has-text-success is-large'>
                        <FontAwesome className='fa-3x' name='thumbs-up' />
                      </span>
                    </div>
                  </div>
                  <div className='columns'>
                    <div className='column'>
                      Dataset conciliado
                    </div>
                  </div>
                </div>
              </div>
              <div className='field is-grouped'>
                <b>Fecha mínima:</b> <span style={{paddingLeft: '5px'}}>{dataset.dateMin}</span>
              </div>
              <div className='field is-grouped'>
                <b>Fecha máxima:</b> <span style={{paddingLeft: '5px'}}>{dataset.dateMax}</span>
              </div>
              <ConfigureViewDataset
                initialState={dataset}
              />
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'pendingRows') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Dataset enviado a procesamiento
              </p>
            </header>
            <div className='card-content'>
              <div className='message is-success'>
                <div className='message-body is-large has-text-centered'>
                  <div className='columns'>
                    <div className='column'>
                      <span className='icon has-text-success is-large'>
                        <FontAwesome className='fa-3x fa-spin' name='cog' />
                      </span>
                    </div>
                  </div>
                  <div className='columns'>
                    <div className='column'>
                      Este Dataset se está procesando para ajuste, en unos momentos más aparecerá su información
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'adjustment') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Procesando ajustes del Dataset
              </p>
            </header>
            <div className='card-content'>
              <div className='message is-success'>
                <div className='message-body is-large has-text-centered'>
                  <div className='columns'>
                    <div className='column'>
                      <span className='icon has-text-success is-large'>
                        <FontAwesome className='fa-3x fa-spin' name='cog' />
                      </span>
                    </div>
                  </div>
                  <div className='columns'>
                    <div className='column'>
                      Se está haciendo ajuste de este Dataset
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

  /*
   * Unidentified products/sales center methods
   */
  setHeights (elements) {
    const scrollBody = elements || document.querySelectorAll('[data-content]')

    scrollBody.forEach((sticky) => {
      let bottom = sticky.getBoundingClientRect().bottom
      const footerHeight = 0
      const viewporHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
      this.setState({bodyHeight: viewporHeight - (bottom + footerHeight)})
    })
  }

  toggleHeader () {
    this.setState({isHeaderOpen: !this.state.isHeaderOpen}, function () {
      this.setHeights()
    })
  }

  getHeight (element) {
    if (this.state.bodyHeight === 0) {
      if (element) this.setHeights([element])
    }
  }

  toggleUnidentifiedProducts () {
    this.setState({isProductsOpen: !this.state.isProductsOpen}, function () {
      this.setHeights()
    })
  }

  toggleUnidentifiedSalesCenters () {
    this.setState({isSalesCenterOpen: !this.state.isSalesCenterOpen}, function () {
      this.setHeights()
    })
  }

  toggleUnidentifiedChannels () {
    this.setState({isChannelsOpen: !this.state.isChannelsOpen}, function () {
      this.setHeights()
    })
  }

  showModal (item) {
    if (!item.category) {
      item.category = ''
    }
    if (!item.subcategory) {
      item.subcategory = ''
    }
    this.setState({
      currentProduct: item,
      className: ' is-active'
    })
  }

  hideModal () {
    this.setState({
      className: '',
      currentProduct: null
    })
  }

  showModalSalesCenters (item) {
    this.setState({
      currentSalesCenter: item,
      classNameSC: ' is-active'
    })
  }

  hideModalSalesCenters () {
    this.setState({
      classNameSC: '',
      currentSalesCenter: null
    })
  }

  showModalChannels (item) {
    this.setState({
      classNameCh: ' is-active',
      currentChannel: item
    })
  }

  hideModalChannels () {
    this.setState({
      classNameCh: '',
      currentChannel: null
    })
  }

  getModalCurrentProduct () {
    if (this.state.currentProduct) {
      return (<BaseModal
        title='Edit Product'
        className={this.state.className}
        hideModal={() => this.hideModal()}
        >
        <ProductForm
          baseUrl='/admin/products'
          url={'/admin/products/' + this.state.currentProduct.uuid}
          initialState={this.state.currentProduct}
          load={this.deleteNewProduct.bind(this)}
          >
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary' type='submit'>Guardar</button>
            </div>
            <div className='control'>
              <button className='button' onClick={() => this.hideModal()} type='button'>Cancelar</button>
            </div>
          </div>
        </ProductForm>
      </BaseModal>)
    }
  }

  getModalSalesCenters () {
    if (this.state.currentSalesCenter) {
      return (<BaseModal
        title='Edit Sales Center'
        className={this.state.classNameSC}
        hideModal={() => this.hideModalSalesCenters()}
    >
        <SalesCenterForm
          baseUrl='/admin/salesCenters'
          url={'/admin/salesCenters/' + this.state.currentSalesCenter.uuid}
          initialState={this.state.currentSalesCenter}
          load={this.deleteNewSalesCenter.bind(this)}
      >
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary' type='submit'>Guardar</button>
            </div>
            <div className='control'>
              <button
                className='button'
                onClick={() => this.hideModalSalesCenters()}
                type='button'
              >
                Cancelar
              </button>
            </div>
          </div>
        </SalesCenterForm>
      </BaseModal>)
    }
  }

  getModalChannels () {
    if (this.state.currentChannel) {
      return (<BaseModal
        title='Editar Canal'
        className={this.state.classNameCh}
        hideModal={() => this.hideModalChannels()} >
        <ChannelForm
          baseUrl='/admin/channels'
          url={'/admin/channels/' + this.state.currentChannel.uuid}
          initialState={this.state.currentChannel}
          load={this.deleteNewChannel.bind(this)}>
          <div className='field is-grouped'>
            <div className='control'>
              <button className='button is-primary' type='submit'>Save</button>
            </div>
            <div className='control'>
              <button className='button' onClick={() => this.hideModalChannels()} type='button'>Cancel</button>
            </div>
          </div>
        </ChannelForm>
      </BaseModal>)
    }
  }

  async deleteNewProduct () {
    this.load()
    setTimeout(() => {
      this.hideModal()
    }, 1000)
  }

  async deleteNewSalesCenter () {
    this.load()
    setTimeout(() => {
      this.hideModalSalesCenters()
    }, 1000)
  }

  async deleteNewChannel () {
    this.load()
    setTimeout(() => {
      this.hideModalChannels()
    }, 1000)
  }

  getUnidentifiedChannels () {
    const { dataset } = this.state
    if (!dataset.uuid) {
      return <Loader />
    }

    const headerChannelsClass = classNames('card-content', {
      'is-hidden': this.state.isChannelsOpen === false
    })

    const toggleBtnIconClass = classNames('fa', {
      'fa-angle-down': this.state.isChannelsOpen === false,
      'fa-angle-up': this.state.isChannelsOpen !== false
    })

    var newChannels = []
    dataset.newChannels.map((item, key) => {
      if (item.isNewExternal) {
        newChannels.push(item)
      }
    })

    if ((dataset.status !== 'reviewing' &&
      dataset.status !== 'conciliated') ||
      newChannels.length === 0) {
      return ''
    }

    return (<div className='columns'>
      <div className='column'>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
                Canales no identificados: {newChannels.length}
            </p>
            <div className='field is-grouped is-grouped-right card-header-select'>
              <div className='control'>
                <a
                  className='button is-inverted'
                  onClick={() => this.toggleUnidentifiedChannels()}>
                  <span className='icon is-small'>
                    <i className={toggleBtnIconClass} />
                  </span>
                </a>
              </div>
            </div>
          </header>
          <div className={headerChannelsClass}>
            <div className='columns'>
              <div className='column'>
                <table className='table is-fullwidth'>
                  <thead>
                    <tr>
                      <th colSpan='2'>Id Externo</th>
                      <th colSpan='2'>Nombre</th>
                      <th colSpan='2'>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      newChannels.map((item, key) => {
                        return (
                          <tr key={key}>
                            <td colSpan='2'>{item.externalId}</td>
                            <td colSpan='2'>{item.name}</td>
                            <td colSpan='2'>
                              <button className='button is-primary' onClick={() => this.showModalChannels(item)}>
                                  Edit
                                </button>
                            </td>
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>)
  }

  getUnidentifiedSalesCenters () {
    const { dataset } = this.state
    if (!dataset.uuid) {
      return <Loader />
    }

    const headerSalesCenterClass = classNames('card-content', {
      'is-hidden': this.state.isSalesCenterOpen === false
    })

    const toggleBtnIconClass = classNames('fa', {
      'fa-angle-down': this.state.isSalesCenterOpen === false,
      'fa-angle-up': this.state.isSalesCenterOpen !== false
    })

    var newSalesCenters = []
    dataset.newSalesCenters.map((item, key) => {
      if (item.isNewExternal) {
        newSalesCenters.push(item)
      }
    })

    if ((dataset.status !== 'reviewing' &&
      dataset.status !== 'conciliated') ||
      newSalesCenters.length === 0) {
      return ''
    }

    return (<div className='columns'>
      <div className='column'>
        <div className='card'>
          <header className='card-header'>
            <p className='card-header-title'>
                Centros de Venta no identificados: {newSalesCenters.length}
            </p>
            <div className='field is-grouped is-grouped-right card-header-select'>
              <div className='control'>
                <a
                  className='button is-inverted'
                  onClick={() => this.toggleUnidentifiedSalesCenters()}>
                  <span className='icon is-small'>
                    <i className={toggleBtnIconClass} />
                  </span>
                </a>
              </div>
            </div>
          </header>
          <div className={headerSalesCenterClass}>
            <div className='columns'>
              <div className='column'>
                <table className='table is-fullwidth'>
                  <thead>
                    <tr>
                      <th colSpan='2'>Id Externo</th>
                      <th colSpan='2'>Nombre</th>
                      <th colSpan='2'>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      newSalesCenters.map((item, key) => {
                        return (
                          <tr key={key}>
                            <td colSpan='2'>{item.externalId}</td>
                            <td colSpan='2'>{item.name}</td>
                            <td colSpan='2'>
                              <button className='button is-primary' onClick={() => this.showModalSalesCenters(item)}>
                                  Edit
                                </button>
                            </td>
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>)
  }

  getUnidentifiedProducts () {
    const { dataset } = this.state

    if (!dataset.uuid) {
      return <Loader />
    }

    const headerProductsClass = classNames('card-content', {
      'is-hidden': this.state.isProductsOpen === false
    })
    const toggleBtnIconClass = classNames('fa', {
      'fa-angle-down': this.state.isProductsOpen === false,
      'fa-angle-up': this.state.isProductsOpen !== false
    })

    var newProducts = []
    dataset.newProducts.map((item, key) => {
      if (item.isNewExternal) {
        newProducts.push(item)
      }
    })

    if ((dataset.status !== 'reviewing' &&
      dataset.status !== 'conciliated') ||
      newProducts.length === 0) {
      return ''
    }

    return (
      <div className='columns'>
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                  Productos no identificados: {newProducts.length}
              </p>
              <div className='field is-grouped is-grouped-right card-header-select'>
                <div className='control'>
                  <a
                    className='button is-inverted'
                    onClick={() => this.toggleUnidentifiedProducts()}>
                    <span className='icon is-small'>
                      <i className={toggleBtnIconClass} />
                    </span>
                  </a>
                </div>
              </div>
            </header>
            <div className={headerProductsClass}>
              <div className='columns'>
                <div className='column'>
                  <table className='table is-fullwidth'>
                    <thead>
                      <tr>
                        <th colSpan='2'>Id Externo</th>
                        <th colSpan='2'>Nombre</th>
                        <th colSpan='2'>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        newProducts.map((item, key) => {
                          return (
                            <tr key={key}>
                              <td colSpan='2'>{item.externalId}</td>
                              <td colSpan='2'>{item.name}</td>
                              <td colSpan='2'>
                                <button className='button is-primary' onClick={() => this.showModal(item)}>
                                    Edit
                                  </button>
                              </td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
                    <DeleteButton
                      titleButton={'Eliminar'}
                      objectName='Dataset'
                      objectDelete={this.deleteObject.bind(this)}
                      message={`Estas seguro de que deseas eliminar el dataset ${dataset.name}?`}
                    />
                  </div>
                </div>
              </div>
            </div>
            {this.getUnidentifiedProducts()}
            {this.getUnidentifiedSalesCenters()}
            {this.getUnidentifiedChannels()}
            <div className='columns'>
              <div className='column is-5-tablet'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Dataset
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <DatasetDetailForm
                          baseUrl='/admin/datasets'
                          url={'/admin/datasets/' + this.props.match.params.uuid}
                          initialState={{
                            name: this.state.dataset.name,
                            description: this.state.dataset.description,
                            organization: this.state.dataset.organization.uuid,
                            status: dataset.status
                          }}
                          load={this.load.bind(this)}
                          organizations={this.state.organizations}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button className='button is-primary'>Guardar</button>
                            </div>
                          </div>
                        </DatasetDetailForm>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {this.getUpload()}
            </div>
          </div>
        </div>
        {this.getModalCurrentProduct()}
        {this.getModalSalesCenters()}
        {this.getModalChannels()}
      </div>
    )
  }
}

DataSetDetail.contextTypes = {
  tree: PropTypes.baobab
}

const branchedDataSetDetail = branch({datasets: 'datasets'}, DataSetDetail)

export default Page({
  path: '/datasets/detail/:uuid',
  title: 'Dataset detail',
  icon: 'check',
  exact: true,
  validate: loggedIn,
  component: branchedDataSetDetail
})
