import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'
import Loader from '~base/components/spinner'
import FontAwesome from 'react-fontawesome'
import env from '~base/env-variables'
import classNames from 'classnames'
import { testRoles } from '~base/tools'
import { toast } from 'react-toastify'

import Page from '~base/page'
import {loggedIn, verifyRole} from '~base/middlewares/'
import DatasetDetailForm from './detail-form'
import { UploadDataset } from '~base/components/base-uploads'
import ConfigureDatasetForm from './configure-form'
import DeleteButton from '~base/components/base-deleteButton'
import ConfigureViewDataset from './configure-view'
import BaseModal from '~base/components/base-modal'
import ProductForm from './edit-product'
import SalesCenterForm from './edit-salescenter'
import ChannelForm from './edit-channel'
import Checkbox from '~base/components/base-checkbox'
import Breadcrumb from '~base/components/base-breadcrumb'
import {datasetStatus} from '~base/tools'
import NotFound from '~base/components/not-found'

class DataSetDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: '',
      classNameSC: '',
      classNameCh: '',
      isProductsOpen: false,
      isChannelsOpen: false,
      isSalesCenterOpen: false,
      loading: true,
      loaded: false,
      dataset: {},
      currentProduct: null,
      currentSalesCenter: null,
      columns: [],
      roles: 'admin, orgadmin, analyst',
      canEdit: false,
      isLoading: '',
      isLoadingConsolidate: '',
      isLoadingConfigure: '',
      selectedProducts: new Set(),
      selectAllProducts: false,
      selectAllSalesCenters: false,
      selectedSalesCenters: new Set(),
      selectAllChannels: false,
      selectedChannels: new Set(),
      disableBtnC: true,
      isLoadingBtnC: '',
      disableBtnP: true,
      isLoadingBtnP: '',
      disableBtnS: true,
      isLoadingBtnS: ''
    }
    this.newProducts = []
    this.newChannels = []
    this.newSalesCenters = []
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
    this.interval = setInterval(() => {
      if (this.state.dataset.status === 'preprocessing' ||
        this.state.dataset.status === 'processing' ||
        this.state.dataset.status === 'uploaded' ||
        this.state.dataset.status === 'receiving' ||
        this.state.dataset.status === 'pendingRows') {
        this.load()
      }
    }, 30000)
    this.setState({canEdit: testRoles(this.state.roles)})
  }

  componentWillUnmount () {
    clearInterval(this.interval)
  }

  async load () {
    var url = '/app/datasets/' + this.props.match.params.uuid
    
    try {
      const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      dataset: body.data
    })
  }catch (e) {
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
    if (!this.state.canEdit) return
    var url = `/app/projects/${this.state.dataset.project.uuid}/remove/dataset`
    await api.post(url, { dataset: this.props.match.params.uuid })
    this.props.history.push('/projects/' + this.state.dataset.project.uuid)
  }

  async configureOnClick () {
    if (!this.state.canEdit) return

    this.setState({ isLoadingConfigure: ' is-loading' })
    var url = '/app/datasets/' + this.props.match.params.uuid + '/set/configure'
    await api.post(url)
    await this.load()
    this.setState({ isLoadingConfigure: '' })
  }

  async consolidateOnClick () {
    if (!this.state.canEdit) return

    this.setState({ isLoadingConsolidate: ' is-loading' })
    var url = '/app/datasets/' + this.props.match.params.uuid + '/set/conciliate'
    await api.post(url)
    await this.load()
    this.setState({ isLoadingConsolidate: '' })
    this.props.history.push(`/projects/${this.state.dataset.project.uuid}`)
  }

  async cancelOnClick () {
    await this.configureOnClick()
  }

  getUpload () {
    let { dataset, canEdit } = this.state
    let url = ''
    
    if (env.ENV === 'production') {
      url = `/api/app/upload/`
    } else {
      url = `${env.API_HOST}/api/app/upload/`
    }

    if (
      (!dataset.fileChunk && dataset.source === 'uploaded') ||
      (dataset.fileChunk && dataset.status === 'uploading')
    ) {
      if (canEdit) {
        return (
          <div className='column'>
            <UploadDataset
              query={{dataset: dataset.uuid}}
              load={() => { this.load() }}
              url={url}
            />
          </div>
        )
      } else {
        return (
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Subir archivo
                </p>
              </header>
              <div className='card-content'>
                <div className='columns is-centered'>
                  <div className='column is-8 is-narrow'>
                    <div className='message is-info'>
                      <div className='message-body is-large has-text-centered'>
                        <div className='media'>
                          <div className='media-left'>
                            <span className='icon is-large'>
                              <FontAwesome className='fa-2x' name='info-circle' />
                            </span>
                          </div>
                          <div className='media-content'>
                            Aún no se a cargado un archivo. 
                            Favor de acudir con su supervisor para cualquier aclaración.
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
              <div className='columns is-centered'>
                <div className='column is-8 is-narrow'>
                  <div className='message is-success'>
                    <div className='message-body is-large has-text-centered'>
                      <div className='media'>
                        <div className='media-left'>
                          <span className='icon is-large'>
                            <FontAwesome className='fa-2x fa-spin' name='cog' />
                          </span>
                        </div>
                        <div className='media-content'>
                          El archivo {dataset.fileChunk.filename} ha sido cargado y 
                          se enviará para preprocesamiento.
                          Favor de regresar en un par de minutos.
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
    } else if (dataset.status === 'preprocessing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Dataset enviado a preprocesamiento
              </p>
            </header>
            <div className='card-content'>
              <div className='columns is-centered'>
                <div className='column is-8 is-narrow'>
                  <div className='message is-success'>
                    <div className='message-body is-large has-text-centered'>
                      <div className='media'>
                        <div className='media-left'>
                          <span className='icon is-large'>
                            <FontAwesome className='fa-2x' name='hourglass-half' />
                          </span>
                        </div>
                        <div className='media-content'>
                          El dataset {dataset.fileChunk.filename} se está preprocesando
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
    } else if (dataset.status === 'processing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Procesando Dataset
              </p>
            </header>
            <div className='card-content'>
              <div className='columns is-centered'>
                <div className='column is-8 is-narrow'>
                  <div className='message is-success'>
                    <div className='message-body is-large has-text-centered'>
                      <div className='media'>
                        <div className='media-left'>
                          <span className='icon is-large'>
                            <FontAwesome className='fa-2x fa-spin' name='cog' />
                          </span>
                        </div>
                        <div className='media-content'>
                          El dataset {dataset.fileChunk.filename} se está procesando
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='columns'>
                <div className='column'>
                  <div className='field is-grouped'>
                    <div className='control'>
                      { canEdit &&
                        <button
                          className={'button is-info' + this.state.isLoadingConfigure}
                          disabled={!!this.state.isLoadingConfigure}
                          onClick={e => this.cancelOnClick()}
                        >
                          Cancelar
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'configuring') {
      if (canEdit) {
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
                      columns={dataset.columns}
                      url={'/app/datasets/' + dataset.uuid + '/configure'}
                      changeHandler={(data) => this.changeHandler(data)}
                      load={this.load.bind(this)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className='column'>
            <div className='card'>
              <header className='card-header'>
                <p className='card-header-title'>
                  Configurando el Dataset
                </p>
              </header>
              <div className='card-content'>
                <div className='columns is-centered'>
                  <div className='column is-8 is-narrow'>
                  <div className='message is-info'>
                    <div className='message-body is-large has-text-centered'>
                      <div className='media'>
                        <div className='media-left'>
                          <span className='icon is-large'>
                            <FontAwesome className='fa-2x' name='info-circle' />
                          </span>
                        </div>
                        <div className='media-content'>
                          Configuración en proceso!
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
                  <ConfigureViewDataset
                    fmin={dataset.dateMin}
                    fmax={dataset.dateMax}
                    initialState={dataset}
                  />
                  { canEdit &&
                    <div className='field is-grouped'>
                      <div className='control'>
                        <button
                          className={'button is-info' + this.state.isLoadingConfigure}
                          disabled={!!this.state.isLoadingConfigure}
                          onClick={e => this.configureOnClick()}
                        >
                          Configurar
                        </button>
                      </div>
                      <div className='control'>
                        <button
                          className={'button is-success' + this.state.isLoadingConsolidate}
                          disabled={!!this.state.isLoadingConsolidate}
                          onClick={e => this.consolidateOnClick()}
                        >
                          Conciliar
                        </button>
                      </div>
                    </div>
                  }
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
              <ConfigureViewDataset
                fmin={dataset.dateMin}
                fmax={dataset.dateMax}
                statusText={'Dataset conciliado'}
                statusIcon={'fa fa-2x fa-check'}
                initialState={dataset}
              />
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'pendingRows' || dataset.status === 'receiving') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Dataset enviado a procesamiento
              </p>
            </header>
            <div className='card-content'>
              <div className='columns is-centered'>
                <div className='column is-8 is-narrow'>
                  <div className='message is-success'>
                    <div className='message-body is-large has-text-centered'>
                      <div className='media'>
                        <div className='media-left'>
                          <span className='icon is-large'>
                            <FontAwesome className='fa-2x fa-spin' name='cog' />
                          </span>
                        </div>
                        <div className='media-content'>
                          Este Dataset se está procesando para ajuste, en unos momentos más aparecerá su información
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
              <ConfigureViewDataset
                fmin={dataset.dateMin}
                fmax={dataset.dateMax}
                statusText={'Se está haciendo ajuste de este Dataset'}
                statusIcon={'fa fa-2x fa-pencil'}
                initialState={dataset}
              />
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'error') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                Estado del dataset
              </p>
            </header>
            <div className='card-content'>
              <div className='columns is-centered'>
                <div className='column is-8 is-narrow'>
                  <div className='message is-danger'>
                    <div className='message-body is-large has-text-centered'>
                      <div className='media'>
                        <div className='media-left'>
                          <span className='icon is-large'>
                            <FontAwesome className='fa-2x' name='warning' />
                          </span>
                        </div>
                        <div className='media-content'>
                          Se ha generado un error. Por favor intenta borrar este dataset y generar otro.
                      Si no se soluciona, contacta a un administrador.
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

  getHeight (element) {
    if (this.state.bodyHeight === 0) {
      if (element) this.setHeights([element])
    }
  }

  showModal (item) {
    this.setState({
      className: ' is-active',
      currentProduct: item
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
      classNameSC: ' is-active',
      currentSalesCenter: item
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

  submitHandler () {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler () {
    this.setState({ isLoading: '' })
  }

  finishUpHandler () {
    this.setState({ isLoading: '' })
  }

  getModalCurrentProduct () {
    if (this.state.currentProduct && this.state.canEdit) {
      return (<BaseModal
        title='Editar Producto'
        className={this.state.className}
        hideModal={() => this.hideModal()}
        >
        <ProductForm
          baseUrl='/app/products'
          url={'/app/products/' + this.state.currentProduct.uuid}
          initialState={this.state.currentProduct}
          load={this.deleteNewProduct.bind(this)}
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
            <div className='control'>
              <button className='button' onClick={() => this.hideModal()} type='button'>Cancelar</button>
            </div>
          </div>
        </ProductForm>
      </BaseModal>)
    }
  }

  getModalChannels () {
    if (this.state.currentChannel && this.state.canEdit) {
      return (<BaseModal
        title='Editar Canal'
        className={this.state.classNameCh}
        hideModal={() => this.hideModalChannels()} >
        <ChannelForm
          baseUrl='/app/channels'
          url={'/app/channels/' + this.state.currentChannel.uuid}
          initialState={this.state.currentChannel}
          load={this.deleteNewChannel.bind(this)}
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
            <div className='control'>
              <button className='button' onClick={() => this.hideModalChannels()} type='button'>Cancelar</button>
            </div>
          </div>
        </ChannelForm>
      </BaseModal>)
    }
  }

  getModalSalesCenters () {
    if (this.state.currentSalesCenter && this.state.canEdit) {
      return (<BaseModal
        title='Editar Centro de Venta'
        className={this.state.classNameSC}
        hideModal={() => this.hideModalSalesCenters()}
      >
        <SalesCenterForm
          baseUrl='/app/salesCenters'
          url={'/app/salesCenters/' + this.state.currentSalesCenter.uuid}
          initialState={this.state.currentSalesCenter}
          load={this.deleteNewSalesCenter.bind(this)}
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
            <div className='control'>
              <button className='button' onClick={() => this.hideModalSalesCenters()} type='button'>Cancelar</button>
            </div>
          </div>
        </SalesCenterForm>
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
    const { dataset, canEdit } = this.state
    if (!dataset.uuid) {
      return <Loader />
    }

    const headerChannelsClass = classNames('card-content', {
      'is-hidden': this.state.isChannelsOpen === false
    })

    const toggleBtnIconClass = classNames('fa fa-2x', {
      'fa-caret-down': this.state.isChannelsOpen === false,
      'fa-caret-up': this.state.isChannelsOpen !== false
    })

    this.newChannels = []
    dataset.newChannels.map((item, key) => {
      if (item.isNewExternal) {
        this.newChannels.push(item)
      }
    })

    if ((dataset.status !== 'reviewing' &&
      dataset.status !== 'conciliated') ||
      this.newChannels.length === 0) {
      return ''
    }

    return (<div className='columns unidentified'>
      <div className='column'>
        <div className='card'>
          <header className='card-header deep-shadow '>
            <p className='card-header-title'>
                Canales no identificados: {this.newChannels.length}
            </p>
            <div className='field is-grouped is-grouped-right card-header-select'>
              {canEdit &&
              <div className={this.state.isChannelsOpen ? 'control' : 'is-hidden'}>
                <button
                  onClick={() => this.confirmChannels()}
                  disabled={this.state.disableBtnC || !!this.state.isLoadingBtnC}
                  className={'button is-primary is-outlined is-pulled-right confirm-btn ' + this.state.isLoadingBtnC}
                >
                  Confirmar ({this.state.selectedChannels.size})
                </button>
              </div>
              }
              <div className='control'>
                <a
                  className='button is-info undefined-btn'
                  onClick={() => this.toggleUnidentifiedChannels()}>
                  <span className='icon is-large'>
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
                      {canEdit &&
                        <th className='has-text-centered'>
                          <span title='Seleccionar todos'>
                            <Checkbox
                              label='checkAll'
                              handleCheckboxChange={(e) => this.checkAllChannels(!this.state.selectAllChannels)}
                              key='checkAll'
                              checked={this.state.selectAllChannels}
                              hideLabel />
                          </span>
                        </th>
                      }
                      <th>Id Externo</th>
                      <th>Nombre</th>
                      { canEdit &&
                        <th>Acciones</th>
                      }                      
                    </tr>
                  </thead>
                  <tbody>
                    {
                      this.newChannels.map((item, key) => {
                        if (!item.selected) {
                          item.selected = false
                        }
                        return (
                          <tr key={key}>
                            {canEdit &&
                              <td className='has-text-centered'>
                                <Checkbox
                                  label={item}
                                  handleCheckboxChange={this.toggleCheckboxChannels}
                                  key={item.externalId}
                                  checked={item.selected}
                                  hideLabel />
                              </td>
                            }
                            <td>{item.externalId}</td>
                            <td>{item.name}</td>
                            { canEdit &&
                              <td>
                                <button
                                  className='button is-primary'
                                  onClick={() => this.showModalChannels(item)}
                                >
                                  <span className='icon' title='Editar'>
                                  <i className='fa fa-pencil' />
                                  </span>
                                </button>
                              </td>
                            }                      
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
    const { dataset, canEdit } = this.state
    if (!dataset.uuid) {
      return <Loader />
    }

    const headerSalesCenterClass = classNames('card-content', {
      'is-hidden': this.state.isSalesCenterOpen === false
    })

    const toggleBtnIconClass = classNames('fa fa-2x', {
      'fa-caret-down': this.state.isSalesCenterOpen === false,
      'fa-caret-up': this.state.isSalesCenterOpen !== false
    })

    this.newSalesCenters = []
    dataset.newSalesCenters.map((item, key) => {
      if (item.isNewExternal) {
        this.newSalesCenters.push(item)
      }
    })

    if ((dataset.status !== 'reviewing' &&
      dataset.status !== 'conciliated') ||
      this.newSalesCenters.length === 0) {
      return ''
    }

    return (<div className='columns unidentified'>
      <div className='column'>
        <div className='card'>
          <header className='card-header deep-shadow'>
            <p className='card-header-title'>
                Centros de Venta no identificados: {this.newSalesCenters.length}
            </p>
            <div className='field is-grouped is-grouped-right card-header-select'>
              {canEdit &&
              <div className={this.state.isSalesCenterOpen ? 'control' : 'is-hidden'}>
                <button
                  onClick={() => this.confirmSalesCenters()}
                  disabled={this.state.disableBtnS || !!this.state.isLoadingBtnS}
                  className={'button is-primary is-outlined is-pulled-right confirm-btn ' + this.state.isLoadingBtnS}
                >
                  Confirmar ({this.state.selectedSalesCenters.size})
                </button>
              </div> 
              }
              <div className='control'>
                <a
                  className='button is-info undefined-btn'
                  onClick={() => this.toggleUnidentifiedSalesCenters()}>
                  <span className='icon is-large'>
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
                      {
                        canEdit &&
                        <th className='has-text-centered'>
                          <span title='Seleccionar todos'>
                            <Checkbox
                              label='checkAll'
                              handleCheckboxChange={(e) => this.checkAllSalesCenters(!this.state.selectAllSalesCenters)}
                              key='checkAll'
                              checked={this.state.selectAllSalesCenters}
                              hideLabel />
                          </span>
                        </th>
                      }
                      <th>Id Externo</th>
                      <th>Nombre</th>
                      { canEdit &&
                        <th>Acciones</th>
                      }
                      
                    </tr>
                  </thead>
                  <tbody>
                    {
                      this.newSalesCenters.map((item, key) => {
                        if (!item.selected) {
                          item.selected = false
                        }
                        return (
                          <tr key={key}>
                            {canEdit &&
                              <td className='has-text-centered'>
                                <Checkbox
                                  label={item}
                                  handleCheckboxChange={this.toggleCheckboxSalesCenters}
                                  key={item.externalId}
                                  checked={item.selected}
                                  hideLabel />
                              </td>
                            }
                            <td>{item.externalId}</td>
                            <td>{item.name}</td>
                            { canEdit &&
                              <td>
                                <button
                                  className='button is-primary'
                                  onClick={() => this.showModalSalesCenters(item)}
                                >
                                <span className='icon' title='Editar'>
                                  <i className='fa fa-pencil' />
                                </span>
                                </button>
                              </td>
                            }
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
    const { dataset, canEdit } = this.state

    if (!dataset.uuid) {
      return <Loader />
    }

    const headerProductsClass = classNames('card-content', {
      'is-hidden': this.state.isProductsOpen === false
    })
    const toggleBtnIconClass = classNames('fa fa-2x', {
      'fa-caret-down': this.state.isProductsOpen === false,
      'fa-caret-up': this.state.isProductsOpen !== false
    })

    this.newProducts = []
    dataset.newProducts.map((item, key) => {
      if (item.isNewExternal) {
        this.newProducts.push(item)
      }
    })

    if ((dataset.status !== 'reviewing' &&
      dataset.status !== 'conciliated') ||
      this.newProducts.length === 0) {
      return ''
    }

    return (
      <div className='columns unidentified'>
        <div className='column'>
          <div className='card'>
            <header className='card-header deep-shadow'>
              <p className='card-header-title'>
                  Productos no identificados: {this.newProducts.length}
              </p>
              <div className='field is-grouped is-grouped-right card-header-select'>
                {canEdit &&
                <div className={this.state.isProductsOpen ? 'control' : 'is-hidden'}>
                  <button
                    onClick={() => this.confirmProducts()}
                    disabled={this.state.disableBtnP || !!this.state.isLoadingBtnP}
                    className={'button is-primary is-outlined is-pulled-right confirm-btn ' + this.state.isLoadingBtnP}
                  >
                    Confirmar ({this.state.selectedProducts.size})
                  </button>
                </div>
                } 
                <div className='control'>
                  <a
                    className='button is-info undefined-btn'
                    onClick={() => this.toggleUnidentifiedProducts()}>
                    <span className='icon is-large'>
                      <i className={toggleBtnIconClass} />
                    </span>
                  </a>
                </div>
              </div>
            </header>
            <div className={headerProductsClass}>
              <div className='columns'>
                <div className='column'>
                  <table className='table is-fullwidth is-narrow'>
                    <thead>
                      <tr>
                        {canEdit &&
                          <th className='has-text-centered'>
                            <span title='Seleccionar todos'>
                              <Checkbox
                                label='checkAll'
                                handleCheckboxChange={(e) => this.checkAllProducts(!this.state.selectAllProducts)}
                                key='checkAll'
                                checked={this.state.selectAllProducts}
                                hideLabel />
                            </span>
                          </th>
                        }
                        <th>Id Externo</th>
                        <th>Nombre</th>
                        { canEdit &&
                          <th>Acciones</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {
                        this.newProducts.map((item, key) => {
                          if (!item.selected) {
                            item.selected = false
                          }
                          return (
                            <tr key={key}>
                              {canEdit &&
                                <td className='has-text-centered'>
                                  <Checkbox
                                    label={item}
                                    handleCheckboxChange={this.toggleCheckboxProducts}
                                    key={item.externalId}
                                    checked={item.selected}
                                    hideLabel />
                                </td>
                              }
                              <td>{item.externalId}</td>
                              <td>{item.name}</td>
                              { canEdit &&
                                <td>
                                  <button
                                    className='button is-primary'
                                    onClick={() => this.showModal(item)}
                                  >
                                  <span className='icon' title='Editar'>
                                    <i className='fa fa-pencil' />
                                  </span>
                                  </button>
                                </td>
                              }
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

  checkAllProducts = (check) => {
    this.state.selectedProducts.clear()
    for (let item of this.newProducts) {
      if (check)
        this.state.selectedProducts.add(item)

      item.selected = check
    }
    this.setState({ selectAllProducts: check }, function () {
      this.toggleButtons()
    })
  }

  toggleCheckboxProducts = (item, all) => {
    if (this.state.selectedProducts.has(item) && !all) {
      this.state.selectedProducts.delete(item)
      item.selected = false
    }
    else {
      this.state.selectedProducts.add(item)
      item.selected = true
    }

    this.toggleButtons()
  }

  checkAllSalesCenters = (check) => {
    this.state.selectedSalesCenters.clear()
    for (let item of this.newSalesCenters) {
      if (check)
        this.state.selectedSalesCenters.add(item)

      item.selected = check
    }
    this.setState({ selectAllSalesCenters: check }, function () {
      this.toggleButtons()
    })
  }

  toggleCheckboxSalesCenters = (item, all) => {
    if (this.state.selectedSalesCenters.has(item) && !all) {
      this.state.selectedSalesCenters.delete(item)
      item.selected = false
    }
    else {
      this.state.selectedSalesCenters.add(item)
      item.selected = true
    }

    this.toggleButtons()
  }

  checkAllChannels = (check) => {
    this.state.selectedChannels.clear()
    for (let item of this.newChannels) {
      if (check)
        this.state.selectedChannels.add(item)

      item.selected = check
    }
    this.setState({ selectAllChannels: check }, function () {
      this.toggleButtons()
    })
  }

  toggleCheckboxChannels = (item, all) => {
    if (this.state.selectedChannels.has(item) && !all) {
      this.state.selectedChannels.delete(item)
      item.selected = false
    }
    else {
      this.state.selectedChannels.add(item)
      item.selected = true
    }

    this.toggleButtons()
  }


  toggleButtons() {
    let disableP = true
    let disableS = true
    let disableC = true

    if (this.state.selectedProducts.size > 0)
      disableP = false
    if (this.state.selectedChannels.size > 0)
      disableC = false
    if (this.state.selectedSalesCenters.size > 0)
      disableS = false

    this.setState({
      disableBtnP: disableP,
      disableBtnS: disableS,
      disableBtnC: disableC
    })
  }

  async confirmProducts() {
    this.setState({
      isLoadingBtnP: ' is-loading'
    })

    const url = '/app/products/approve'
    let products = Array.from(this.state.selectedProducts).map(item => {
      return {
        ...item,
        category: item.category || '',
        subcategory: item.subcategory || '',
      }
    })

    try {
      let res = await api.post(url, products)
      
      if (res.success > 0) {
        this.notify(`¡Se confirmaron exitosamente ${res.success} productos!`, 5000, toast.TYPE.SUCCESS)
      }

      if (res.error > 0) {
        this.notify(`¡No se pudieron confirmar ${res.error} productos!` , 5000, toast.TYPE.ERROR)
      }

      if (res.error === 0 && res.success === 0) {
        this.notify('¡Error al confirmar productos!' , 5000, toast.TYPE.ERROR)
      }
    } catch(e){
      this.notify('¡Error al confirmar productos!' , 5000, toast.TYPE.ERROR) 
    }
    
    this.setState({
      selectedProducts: new Set(),
      selectAllProducts: false,
      isLoadingBtnP: ''
    }, function () {
      this.toggleButtons()
      this.load()
    })
  }

  async confirmSalesCenters() {
    this.setState({
      isLoadingBtnS: ' is-loading'
    })

    const url = '/app/salesCenters/approve'
    try {
      let res = await api.post(url, Array.from(this.state.selectedSalesCenters))
      
      if (res.success > 0) {
        this.notify(
          `¡Se confirmaron exitosamente ${res.success} centros de venta!`,
          5000,
          toast.TYPE.SUCCESS
        )
      }

      if (res.error > 0) {
        this.notify(
          `¡No se pudieron confirmar ${res.error} centros de venta!`,
          5000,
          toast.TYPE.ERROR
        )
      }

      if (res.error === 0 && res.success === 0) {
        this.notify('¡Error al confirmar centros de venta!' , 5000, toast.TYPE.ERROR)
      }
    } catch(e){
      this.notify('¡Error al confirmar centros de venta!', 5000, toast.TYPE.ERROR) 
    }

    this.setState({
      selectedSalesCenters: new Set(),
      selectAllSalesCenters: false,
      isLoadingBtnS: ''
    }, function () {
      this.toggleButtons()
      this.load()
    })
  }

  async confirmChannels() {
    this.setState({
      isLoadingBtnC: ' is-loading'
    })

    const url = '/app/channels/approve'
    try {
      let res = await api.post(url, Array.from(this.state.selectedChannels))
      
      if (res.success > 0) {
        this.notify(
          `¡Se confirmaron exitosamente ${res.success} canales!`,
          5000,
          toast.TYPE.SUCCESS
        )
      }

      if (res.error > 0) {
        this.notify(
          `¡No se pudieron confirmar ${res.error} canales!`,
          5000,
          toast.TYPE.ERROR
        )
      }

      if (res.error === 0 && res.success === 0) {
        this.notify('¡Error al confirmar canales!' , 5000, toast.TYPE.ERROR)
      }
    } catch(e){
      this.notify('¡Error al confirmar canales!', 5000, toast.TYPE.ERROR) 
    }

    this.setState({
      selectedChannels: new Set(),
      selectAllChannels: false,
      isLoadingBtnC: ''
    }, function () {
      this.toggleButtons()
      this.load()
    })
  }

  notify (message = '', timeout = 5000, type = toast.TYPE.INFO) {
    this.toastId = toast(message, {
      autoClose: timeout,
      type: type,
      hideProgressBar: true,
      closeButton: false
    })
  }

  render () {
    if (this.state.notFound) {
      return <NotFound msg='este dataset' />
    }

    const { dataset, canEdit } = this.state

    if (!dataset.uuid) {
      return <Loader />
    }

    var deleteButton = (
      <DeleteButton
        hideIcon
        titleButton={'Eliminar'}
        objectName='Dataset'
        objectDelete={this.deleteObject.bind(this)}
        message={`¿Estas seguro de que deseas eliminar el dataset ${dataset.name}?`}
      />
    )

    if (!canEdit || dataset.status === 'conciliated') {
      deleteButton = null
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
        <div className='section-header'>
            <h2>{dataset.name}</h2>
        </div>
          <div className=' is-paddingless-top pad-sides'>
            <div className='columns is-marginless'>
              <div className='column is-paddingless'>
            <Breadcrumb
              path={[
                {
                  path: '/',
                  label: 'Inicio',
                  current: false
                },
                {
                  path: '/projects',
                  label: 'Proyectos',
                  current: false
                },
                {
                  path: '/projects/' + dataset.project.uuid,
                  label: dataset.project.name,
                  current: false
                },
                {
                  path: '/datasets',
                  label: 'Datasets',
                  current: true
                },
                {
                  path: '/datasets/',
                  label: dataset.name,
                  current: true
                }
              ]}
              align='left'
            />
            </div>
              <div className='column has-text-right has-20-margin-top is-paddingless'>
                <div className='field is-grouped is-grouped-right'>
                  <div className='control'>
                    <Link
                      className='button is-info'
                      to={'/projects/' + dataset.project.uuid}
                    >
                      Regresar al proyecto
                    </Link>
                  </div>
                  <div className='control'>
                    {deleteButton}
                  </div>
                </div>
              </div>
            </div>
            </div>
          {this.getUnidentifiedProducts()}
          {this.getUnidentifiedSalesCenters()}
          {this.getUnidentifiedChannels()}
          <div className='section is-paddingless-top pad-sides'>
            
            <div className='columns dataset-detail'>
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
                          baseUrl='/app/datasets'
                          url={'/app/datasets/' + this.props.match.params.uuid}
                          initialState={{
                            name: this.state.dataset.name,
                            description: this.state.dataset.description,
                            organization: this.state.dataset.organization.uuid,
                            status: datasetStatus[dataset.status]
                          }}
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
  path: '/datasets/:uuid',
  title: 'Dataset detail',
  icon: 'check',
  exact: true,
  roles: 'consultor, analyst, orgadmin, admin, manager-level-2',
  validate: [loggedIn, verifyRole],
  component: branchedDataSetDetail
})
