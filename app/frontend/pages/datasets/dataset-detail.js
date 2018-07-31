import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
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
import tree from '~core/tree'

import Page from '~base/page'
import { loggedIn, verifyRole } from '~base/middlewares/'
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
import { datasetStatus } from '~base/tools'
import NotFound from '~base/components/not-found'

class DataSetDetail extends Component {
  constructor(props) {
    super(props)
    this.state = {
      className: '',
      classNameSC: '',
      classNameCh: '',
      loading: true,
      loaded: false,
      dataset: {},
      currentUnidentified: null,
      columns: [],
      roles: 'admin, orgadmin, analyst, manager-level-3',
      canEdit: false,
      isLoading: '',
      isLoadingConsolidate: '',
      isLoadingConfigure: '',
      selectedUnidentified: new Set(),
      isLoadingBtnC: '',
      isLoadingBtnP: '',
      isLoadingBtnS: '',
      disableBtnUn: true,
      isLoadingBtnUn: ''
    }

  }

  componentWillMount() {
    tree.set('datasets', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10
    })
    tree.commit()
    this.load()
    this.interval = setInterval(() => {

      if (this.state.dataset.status === 'preprocessing' ||
        this.state.dataset.status === 'processing' ||
        this.state.dataset.status === 'uploaded' ||
        this.state.dataset.status === 'receiving' ||
        this.state.dataset.status === 'pendingRows') {
        this.load()
      }
      if (this.state.dataset.project.status === 'pendingRows' &&
      this.state.dataset.status === 'ready'){
        this.props.setDataset('', 'ajustes')
      }
    }, 10000)
    this.setState({ canEdit: testRoles(this.state.roles) })

  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  async load() {
    var url = '/app/datasets/' + this.props.dataset.uuid

    try {
      const body = await api.get(url)

      this.setState({
        loading: false,
        loaded: true,
        dataset: body.data
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
    this.getUnidentified()

  }

  getColumns() {
    return [
      { //TODO: translate
        'title': 'Nombre',
        'property': 'name',
        'default': 'N/A',
        'sortable': true
      },
      { //TODO: translate
        'title': 'Email',
        'property': 'email',
        'default': 'N/A',
        'sortable': true
      },
      { //TODO: translate
        'title': 'Acciones',
        formatter: (row) => {
          return <Link className='button' to={'/manage/users/' + row.uuid}>
            <FormattedMessage
              id="datasets.detail"
              defaultMessage={`Detalle`}
            />
          </Link>
        }
      }
    ]
  }

  changeHandler(data) {
    this.setState({
      dataset: data
    })
  }

  async deleteObject() {
    if (!this.state.canEdit) return
    var url = `/app/projects/${this.state.dataset.project.uuid}/remove/dataset`
    await api.post(url, { dataset: this.props.dataset.uuid })
    this.props.setDataset('')
  }

  async configureOnClick() {
    if (!this.state.canEdit) return

    this.setState({ isLoadingConfigure: ' is-loading' })
    var url = '/app/datasets/' + this.props.dataset.uuid + '/set/configure'
    await api.post(url)
    await this.load()
    this.setState({ isLoadingConfigure: '' })
  }

  async consolidateOnClick() {
    if (!this.state.canEdit) return

    this.setState({ isLoadingConsolidate: ' is-loading' })
    var url = '/app/datasets/' + this.props.dataset.uuid + '/set/conciliate'
    await api.post(url)
    await this.load()
    this.setState({ isLoadingConsolidate: '' })
    this.props.setDataset('', 'ajustes')
  }

  async cancelOnClick() {
    await this.configureOnClick()
  }

  getUpload() {
    let { dataset, canEdit } = this.state
    let url = ''

    if (env.ENV === 'production') {
      url = `/api/app/upload/`
    } else {
      url = `${env.API_HOST}/api/app/upload/`
    }

    if (
      (!dataset.fileChunk && dataset.source === 'uploaded') ||
      (dataset.fileChunk && (dataset.status === 'uploading' || dataset.status === 'new'))
    ) {
      if (canEdit) {
        return (
          <div className='column'>
            <UploadDataset
              query={{ dataset: dataset.uuid }}
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
                  <FormattedMessage
                    id="datasets.fileUpload"
                    defaultMessage={`Subir archivo`}
                  />
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
                            <FormattedMessage
                              id="datasets.fileUploadInfo"
                              defaultMessage={`Aún no se a cargado un archivo. Favor de acudir con su supervisor para cualquier aclaración.`}
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

    if (dataset.status === 'uploaded') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                <FormattedMessage
                  id="datasets.fileUploaded"
                  defaultMessage={`Archivo cargado`}
                />
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
                          <FormattedMessage
                            id="datasets.fileUploadedInfo1"
                            defaultMessage={`El archivo`}
                          /> {dataset.fileChunk.filename} <FormattedMessage
                            id="datasets.fileUploadedInfo2"
                            defaultMessage={`ha sido cargado y se enviará para preprocesamiento. Favor de regresar en un par de minutos.`}
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
    } else if (dataset.status === 'preprocessing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                <FormattedMessage
                  id="datasets.processing"
                  defaultMessage={`Dataset enviado a preprocesamiento`}
                />
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
                          <FormattedMessage
                            id="datasets.processingMsg1"
                            defaultMessage={`El datase`}
                          /> {dataset.fileChunk.filename} <FormattedMessage
                            id="datasets.processingMsg2"
                            defaultMessage={`se está preprocesando`}
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
    } else if (dataset.status === 'processing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                <FormattedMessage
                  id="datasets.processingTitle"
                  defaultMessage={`Procesando Dataset`}
                />
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
                          <FormattedMessage
                            id="datasets.processingMsg1"
                            defaultMessage={`El datase`}
                          /> {dataset.fileChunk.filename} <FormattedMessage
                            id="datasets.processingMsg2"
                            defaultMessage={`se está preprocesando`}
                          />
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
                      {canEdit &&
                        <button
                          className={'button is-info' + this.state.isLoadingConfigure}
                          disabled={!!this.state.isLoadingConfigure}
                          onClick={e => this.cancelOnClick()}
                        >
                          <FormattedMessage
                            id="datasets.btnCancel"
                            defaultMessage={`Cancelar`}
                          />
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
                  <FormattedMessage
                    id="datasets.configuring"
                    defaultMessage={`Configurando el Dataset`}
                  />
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
                  <FormattedMessage
                    id="datasets.configuring"
                    defaultMessage={`Configurando el Dataset`}
                  />
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
                            <FormattedMessage
                              id="datasets.configuringMsg"
                              defaultMessage={`Configuración en proceso!`}
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
    } else if (dataset.status === 'reviewing') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                <FormattedMessage
                  id="datasets.reviewing"
                  defaultMessage={`Revisando el dataset`}
                />
              </p>
            </header>
            <div className='card-content'>
              <ConfigureViewDataset
                fmin={dataset.dateMin}
                fmax={dataset.dateMax}
                initialState={dataset}
              />
              {canEdit &&
                <div className='field is-grouped'>
                  <div className='control'>
                    <button
                      className={'button is-info' + this.state.isLoadingConfigure}
                      disabled={!!this.state.isLoadingConfigure}
                      onClick={e => this.configureOnClick()}
                    >
                      <FormattedMessage
                        id="datasets.reviewing"
                        defaultMessage={`Configurar`}
                      />
                    </button>
                  </div>
                  <div className='control'>
                    <button
                      className={'button is-success' + this.state.isLoadingConsolidate}
                      disabled={!!this.state.isLoadingConsolidate}
                      onClick={e => this.consolidateOnClick()}
                    >
                      <FormattedMessage
                        id="datasets.btnConciliate"
                        defaultMessage={`Conciliar`}
                      />
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      )
    } else if (dataset.status === 'conciliating') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                <FormattedMessage
                  id="datasets.conciliation"
                  defaultMessage={`Dataset enviado a conciliación`}
                />
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
                          <FormattedMessage
                            id="datasets.conciliationMsg"
                            defaultMessage={`Este dataset está en proceso de conciliación`}
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
    } else if (dataset.status === 'conciliated' || dataset.status === 'ready') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                <FormattedMessage
                  id="datasets.conciliated"
                  defaultMessage={`Dataset conciliado`}
                />
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
                <FormattedMessage
                  id="datasets.pendingRows"
                  defaultMessage={`Dataset enviado a procesamiento`}
                />
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
                          <FormattedMessage
                            id="datasets.pendingRowsMsg"
                            defaultMessage={`Este Dataset se está procesando para ajuste, en unos momentos más aparecerá su información`}
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
    } else if (dataset.status === 'adjustment') {
      return (
        <div className='column'>
          <div className='card'>
            <header className='card-header'>
              <p className='card-header-title'>
                <FormattedMessage
                  id="datasets.adjustmentTitle"
                  defaultMessage={`Procesando ajustes del Dataset`}
                />
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
                <FormattedMessage
                  id="datasets.errorState"
                  defaultMessage={`Estado del dataset`}
                />
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
                          {
                            testRoles('orgadmin') ? dataset.error
                            : <FormattedMessage
                              id="datasets.errorStateMsg"
                              defaultMessage={`Se ha generado un error. Por favor intenta borrar este dataset y generar otro. Si no se soluciona, contacta a un administrador.`}
                            />
                          }
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
  setHeights(elements) {
    const scrollBody = elements || document.querySelectorAll('[data-content]')

    scrollBody.forEach((sticky) => {
      let bottom = sticky.getBoundingClientRect().bottom
      const footerHeight = 0
      const viewporHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
      this.setState({ bodyHeight: viewporHeight - (bottom + footerHeight) })
    })
  }

  toggleHeader() {
    this.setState({ isHeaderOpen: !this.state.isHeaderOpen }, function () {
      this.setHeights()
    })
  }


  getHeight(element) {
    if (this.state.bodyHeight === 0) {
      if (element) this.setHeights([element])
    }
  }


  submitHandler() {
    this.setState({ isLoading: ' is-loading' })
  }

  errorHandler() {
    this.setState({ isLoading: '' })
  }

  finishUpHandler() {
    this.setState({ isLoading: '' })
  }



  toggleButtons() {

    this.setState({
      ...this.state
    })
  }

  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
    this.toastId = toast(message, {
      autoClose: timeout,
      type: type,
      hideProgressBar: true,
      closeButton: false
    })
  }

  toggleUnidentified(key, item) {
    let uni = this.state.unidentified

    uni[key].headerClass = classNames('card-content', {
      'is-hidden': item.isOpen
    })
    uni[key].iconClass = classNames('fa fa-2x', {
      'fa-caret-down': item.isOpen,
      'fa-caret-up': !item.isOpen
    })
    uni[key].isOpen = !item.isOpen

    this.setState({
      unidentified: uni
    })
  }

  checkUnidentified = (item, check) => {
    if (check) {
      this.state.selectedUnidentified.add(item)
      item.selected = true
    }
    else {
      this.state.selectedUnidentified.delete(item)
      item.selected = false
    }

    this.toggleButtons()
  }

  checkAllUnidentified = (check, key, type) => {
    let uni = this.state.unidentified
    for (let item of uni[key].objects) {

      if (check){
        this.state.selectedUnidentified.add(item)
      }else if(!check && item.type === type){
        this.state.selectedUnidentified.delete(item)
      }

      item.selected = check
    }
    uni[key].selectAll = check
    this.setState({
      unidentified: uni
    })
  }

  countUnidentified(type){
    let count = 0
    for (const item of this.state.selectedUnidentified) {
      if(type === item.type){
        count++
      }
    }
    return count
  }

  async confirmUnidentified(type) {
    this.setState({
      isLoadingBtnC: ' is-loading'
    })

    const url = '/app/catalogItems/approve'
    try {
      let res = await api.post(url, Array.from(this.state.selectedUnidentified).map(item => {
        if(item.type === type)
          return { uuid: item.uuid }
      }))

      if (res.success > 0) {
        this.notify( //TODO: translate
          `¡Se confirmaron exitosamente ${res.success} ${type}!`,
          5000,
          toast.TYPE.SUCCESS
        )
      }

      if (res.error > 0) {
        this.notify( //TODO: translate
          `¡No se pudieron confirmar ${res.error} ${type}!`,
          5000,
          toast.TYPE.ERROR
        )
      }

      if (res.error === 0 && res.success === 0) {
        //TODO: translate
        this.notify(`¡Error al confirmar ${type}!`, 5000, toast.TYPE.ERROR)
      }
    } catch (e) { //TODO: translate
      this.notify(`¡Error al confirmar ${type}!`, 5000, toast.TYPE.ERROR)
    }


    this.setState({
      selectedUnidentified: new Set(),
      isLoadingBtnC: ''
    }, function () {
      this.toggleButtons()
      this.load()
    })
  }

  getModalUnidentified() {
    if (this.state.currentUnidentified && this.state.canEdit) {
      let currentUnidentified = this.state.currentUnidentified
      currentUnidentified.externalId = String(currentUnidentified.externalId)
      return (<BaseModal
        //TODO: translate
        title={'Editar ' + currentUnidentified.catalog.name}
        className={this.state.classNameUn}
        hideModal={() => this.hideModalUnidentified()} >
        <ChannelForm
          baseUrl='/app/catalogItems'
          url={'/app/catalogItems/' + currentUnidentified.uuid}
          initialState={currentUnidentified}
          load={this.deleteUnidentified.bind(this)}
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
              >
                <FormattedMessage
                  id="datasets.btnSave"
                  defaultMessage={`Guardar`}
                />
              </button>
            </div>
            <div className='control'>
              <button className='button' onClick={() => this.hideModalUnidentified()} type='button'>
                <FormattedMessage
                  id="datasets.btnCancel"
                  defaultMessage={`Cancelar`}
                />
              </button>
            </div>
          </div>
        </ChannelForm>
      </BaseModal>)
    }
  }

  async deleteUnidentified() {
    this.load()
    setTimeout(() => {
      this.hideModalUnidentified()
    }, 1000)
  }

  showModalUnidentified(item) {
    this.setState({
      classNameUn: ' is-active',
      currentUnidentified: item
    })
  }

  hideModalUnidentified() {
    this.setState({
      classNameUn: '',
      currentUnidentified: null
    })
  }

  getUnidentified() {
    const { dataset, canEdit } = this.state
    if (!dataset.uuid) {
      return <Loader />
    }

    this.catalogs = {}
    for (let cat of dataset.rule.catalogs) {
      this.catalogs[cat._id] = cat
    }

    if (!this.newCatalogs) {
      this.newCatalogs = dataset.catalogItems.map((item) => {
        if (item.isNewExternal) {
          item.catalog = this.catalogs[item.catalog]
          item.type = item.catalog.slug
          return item
        }
      }).filter(item => item)

      this.newCatalogs = _(this.newCatalogs)
      .groupBy(x => x.catalog.slug)
      .map((value, key) => ({
        type: key,
        name: value[0].catalog.name,
        objects: value,
        headerClass: 'is-hidden',
        iconClass: 'fa fa-2x fa-caret-down',
        isOpen: false,
        selectAll: false
      }))
      .value()
    } else {
      let newCatalogs = dataset.catalogItems.map((item) => {
        if (item.isNewExternal) {
          item.catalog = this.catalogs[item.catalog]
          item.type = item.catalog.slug
          return item
        }
      }).filter(item => item)

      newCatalogs = _(newCatalogs)
      .groupBy(x => x.catalog.slug)
      .map((value, key) => ({
        type: key,
        objects: value,
        selectAll: false
      }))
      .value()
      let auxNewCatalogs = []

      for (let cat of this.newCatalogs) {
        let newItem = newCatalogs.find(item => {
          return item.type === cat.type
        })

        if (!newItem) {
          cat = {}
          continue
        }

        cat.objects = newItem.objects
        cat.selectAll = false
        auxNewCatalogs.push(cat)
      }
      this.newCatalogs = auxNewCatalogs
    }

    this.setState({
      unidentified: this.newCatalogs
    })

  }

renderUnidentified(){
  const { dataset, canEdit } = this.state

  if ((dataset.status !== 'reviewing' &&
    dataset.status !== 'conciliated') ||
    this.state.unidentified.length === 0) {
    return ''
  }

  let unidentified = this.state.unidentified.map((item, key) => {
    return (
      <div key={key} className='columns unidentified'>
        <div className='column'>
          <div className='card'>
            <header className='card-header deep-shadow '>
              <p className='card-header-title'>
                <span className='is-capitalized'>{item.name}</span>&nbsp;no identificados: {item.objects.length}
              </p>
              <div className='field is-grouped is-grouped-right card-header-select'>
                {canEdit &&
                  <div className={item.isOpen ? 'control' : 'is-hidden'}>
                    <button
                      onClick={() => this.confirmUnidentified(item.type)}
                      disabled={this.countUnidentified(item.type) === 0 || !!this.state.isLoadingBtnUn}
                      className={'button is-primary is-outlined is-pulled-right confirm-btn ' + this.state.isLoadingBtnUn}
                    >
                      <FormattedMessage
                        id="datasets.confirm"
                        defaultMessage={`Confirmar`}
                      /> ({this.countUnidentified(item.type)})
                    </button>
                  </div>
                }
                <div className='control'>
                  <a
                    className='button is-info undefined-btn'
                    onClick={() => this.toggleUnidentified(key,item)}>
                    <span className='icon is-large'>
                      <i className={item.iconClass} />
                    </span>
                  </a>
                </div>
              </div>
            </header>
            <div className={item.headerClass}>
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
                                handleCheckboxChange={(e, value) => this.checkAllUnidentified(value, key, item.type)}
                                key='checkAll'
                                checked={item.selectAll}
                                hideLabel />
                            </span>
                          </th>
                        }
                        <th>
                          <FormattedMessage
                            id="datasets.externalId"
                            defaultMessage={`Id Externo`}
                          />
                        </th>
                        <th>
                          <FormattedMessage
                            id="datasets.name"
                            defaultMessage={`Nombre`}
                          />
                        </th>
                        {canEdit &&
                          <th>
                            <FormattedMessage
                              id="datasets.actions"
                              defaultMessage={`Acciones`}
                            />
                          </th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {
                        item.objects.map((ob, key) => {
                          if (!ob.selected) {
                            ob.selected = false
                          }
                          return (
                            <tr key={key}>
                              {canEdit &&
                                <td className='has-text-centered'>
                                  <Checkbox
                                    label={ob}
                                    handleCheckboxChange={(e, value) => this.checkUnidentified(ob,value)}
                                    key={ob.externalId}
                                    checked={ob.selected}
                                    hideLabel />
                                </td>
                              }
                              <td>{ob.externalId}</td>
                              <td>{ob.name}</td>
                              {canEdit &&
                                <td>
                                  <button
                                    className='button is-primary'
                                    onClick={() => this.showModalUnidentified(ob)}
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

  })

  return unidentified
}

  render() {
    if (this.state.notFound) {
      //TODO: translate
      return <NotFound msg='este dataset' />
    }

    const { dataset, canEdit } = this.state

    if (!dataset.uuid) {
      return <Loader />
    }

    var deleteButton = (
      <DeleteButton
        //TODO: translate
        hideIcon
        titleButton={'Eliminar'}
        objectName='Dataset'
        objectDelete={this.deleteObject.bind(this)}
        message={`¿Estas seguro de que deseas eliminar el dataset ${dataset.name}?`}
      />
    )

    if (!canEdit || dataset.status === 'conciliated' || dataset.isMain) {
      deleteButton = null
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className=' is-paddingless-top pad-sides'>
            <div className='level'>
              <div className='level-left'>
                <h2 className='dataset-name level-item'>{dataset.name} {dataset.isMain && '*'}</h2>
              </div>
              <div className='level-right has-text-right has-20-margin-top'>
                <div className='level-item field is-grouped is-grouped-right'>
                  <div className='control'>
                    <a
                      className='button is-info'
                      onClick={() => {this.props.setDataset('')}}
                    >
                      <FormattedMessage
                        id="datasets.btnBack"
                        defaultMessage={`Regresar`}
                      />
                    </a>
                  </div>
                  <div className='control'>
                    {deleteButton}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {
            this.state.unidentified &&
              this.renderUnidentified()
          }
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
                          url={'/app/datasets/' + this.props.dataset.uuid}
                          initialState={{
                            name: this.state.dataset.name,
                            description: this.state.dataset.description,
                            organization: this.state.dataset.organization.uuid,
                            status: dataset.status
                          }}
                          load={this.load.bind(this)}
                          canEdit={canEdit}
                          isAdmin={testRoles('orgadmin')}
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
                              >
                                <FormattedMessage
                                  id="datasets.btnSave"
                                  defaultMessage={`Guardar`}
                                />
                              </button>
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
        {this.getModalUnidentified()}
      </div>
    )
  }
}

export default DataSetDetail

