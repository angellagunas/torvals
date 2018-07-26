import React, { Component } from 'react'
import BaseModal from '~base/components/base-modal'
import tree from '~core/tree'
import Checkbox from '~base/components/base-checkbox'
import moment from 'moment'
import api from '~base/api'
import { toast } from 'react-toastify'
import _ from 'lodash'

class CreateModal extends Component {
  constructor (props) {
    super(props)
    this.hideModal = this.props.hideModal.bind(this)
    this.state = {
      reportType: 'compatible',
      project: this.props.project,
      alias: ''
    }
    this.catalogs = {}
    this.engines = {}
  }

  selectReport (report) {
    if (report === 'compatible') {
      this.catalogs = {}
    }
    this.setState({
      reportType: report
    })
  }

  componentWillMount () {
    this.getDates()
    this.getEngines()
    this.selectAllCatalogs()
  }

  componentWillReceiveProps (next) {
    this.engines = {}
    this.selectAllCatalogs()
    this.setState({
      reportType: 'compatible',
      alias: '',
      generating: '',
      emptyCatalogs: false,
      emptyEngines: false
    })
    if (next.project !== this.state.project) {
      this.setState({
        project: next.project
      }, () => {
        this.getDates()
        this.selectAllCatalogs()
      })
    }
  }

  async getDates () {
    let c = []
    let url = '/app/cycles/project/' + this.state.project.uuid

    try {
      let res = await api.get(url)

      if (res.data) {
        for (let i = 0; i < res.data.length; i++) {
          c.push({
            number: res.data[i].cycle,
            name: `${moment.utc(res.data[i].dateStart).format('MMMM') + ' #' + res.data[i].cycle}`,
            year: moment.utc(res.data[i].dateStart).get('year'),
            dateStart: res.data[i].dateStart
          })
        }

        c = _.orderBy(c, 'year')

        let min
        c.map(item => {
          if (item.year === 2018 && item.number === 1 && item.name === 'enero #1') {
            min = item
          }
        })

        this.setState({
          cycles: c,
          minPeriod: min || { number: 1, name: 'enero', year: 2018 },
          maxPeriod: c[c.length - 1]
        })
      }
    } catch (e) {
      console.log(e)
      this.notify('Error obteniendo ciclos ' + e.message, 5000, toast.TYPE.ERROR)
    }
  }

  setMinPeriod (item) {
    let max = moment.utc(this.state.maxPeriod.dateStart)
    let min = moment.utc(item.dateStart)
    if (min.isBefore(max)) {
      this.setState({
        minPeriod: item
      })
    } else {
      this.setState({
        minPeriod: this.state.maxPeriod,
        maxPeriod: item
      })
    }
  }

  setMaxPeriod (item) {
    let min = moment.utc(this.state.minPeriod.dateStart)
    let max = moment.utc(item.dateStart)
    if (max.isAfter(min)) {
      this.setState({
        maxPeriod: item
      })
    } else {
      this.setState({
        maxPeriod: this.state.minPeriod,
        minPeriod: item
      })
    }
  }

  selectCatalog (value, item) {
    if (this.state.emptyCatalogs) {
      this.setState({
        emptyCatalogs: false
      })
    }
    if (value) {
      this.catalogs[item.uuid] = item
    } else {
      delete this.catalogs[item.uuid]
    }
  }

  selectEngine (value, item) {
    if (this.state.emptyEngines) {
      this.setState({
        emptyEngines: false
      })
    }
    if (value) {
      this.engines[item.uuid] = item
    } else {
      delete this.engines[item.uuid]
    }
  }

  async getEngines () {
    let url = '/app/engines'
    try {
      let res = await api.get(url)

      if (res.data) {
        this.setState({
          engines: res.data
        })
      }
    } catch (e) {
      console.log(e)
      this.notify('Error obteniendo modelos ' + e.message, 5000, toast.TYPE.ERROR)
      this.setState({
        engines: []
      })
    }
  }

  async updateStep () {
    try {
      let user = tree.get('user')
      if (user.currentOrganization.wizardSteps.forecast) {
        return
      }
      let url = '/app/organizations/' + user.currentOrganization.uuid + '/step'

      let res = await api.post(url, {
        step: {
          name: 'project',
          value: true
        }
      })

      if (res) {
        let me = await api.get('/user/me')
        tree.set('user', me.user)
        tree.set('organization', me.user.currentOrganization)
        tree.set('rule', me.rule)
        tree.set('role', me.user.currentRole)
        tree.set('loggedIn', me.loggedIn)
        tree.commit()
        return true
      } else {
        return false
      }
    } catch (e) {
      console.log(e)
      return false
    }
  }

  async generateForecast () {
    if (Object.values(this.engines).length === 0) {
      this.setState({
        emptyEngines: true
      })
      return
    }
    if (this.state.reportType === 'informative' && Object.keys(this.catalogs).length === 0) {
      this.setState({
        emptyCatalogs: true
      })
      return
    }
    this.setState({
      generating: ' is-loading'
    })
    let url = '/app/forecastGroups'
    try {
      let res = await api.post(url, {
        project: this.state.project.uuid,
        alias: this.state.alias !== '' ? this.state.alias : moment.utc().format('YYYY-MM-DD HH:mm:ss'),
        type: this.state.reportType,
        engines: Object.keys(this.engines),
        catalogs: this.state.reportType === 'informative' ? Object.keys(this.catalogs) : undefined,
        dateStart: this.state.reportType === 'informative' ? moment.utc(this.state.minPeriod.dateStart).startOf('month').format('YYYY-MM-DD') : undefined,
        dateEnd: this.state.reportType === 'informative' ? moment.utc(this.state.maxPeriod.dateStart).endOf('month').format('YYYY-MM-DD') : undefined
      })

      if (res) {
        this.engines = {}
        this.selectAllCatalogs()
        this.setState({
          reportType: 'compatible',
          alias: '',
          generating: ''
        }, () => {
          this.hideModal()
          this.props.finishUp(res)
        })
        await this.updateStep()
      }
    } catch (e) {
      console.log(e)
      this.notify('Error generando forecast ' + e.message, 5000, toast.TYPE.ERROR)
      this.setState({
        generating: ''
      })
    }
  }

  notify (message = '', timeout = 5000, type = toast.TYPE.INFO) {
    if (!toast.isActive(this.toastId)) {
      this.toastId = toast(message, {
        autoClose: timeout,
        type: type,
        hideProgressBar: true,
        closeButton: false
      })
    } else {
      toast.update(this.toastId, {
        render: message,
        type: type,
        autoClose: timeout,
        closeButton: false
      })
    }
  }

  selectAllCatalogs () {
    let rules = tree.get('rule')
    rules.catalogs.map(item => {
      this.catalogs[item.uuid] = item
    })
  }

  render () {
    let rules = tree.get('rule')
    return (
      <div className='forecast'>
        <BaseModal
          title={'Crear predicción'}
          className={this.props.className}
          hideModal={this.hideModal}>

          <div className='field'>
            <label className='label'>Alias</label>
            <div className='control'>
              <input
                className='input'
                type='text'
                value={this.state.alias}
                placeholder='Escribe un alias para identificar tu predicción'
                onChange={(e) => this.setState({ alias: e.target.value })} />
            </div>
          </div>

          <div className='field'>
            <label className='label'>Elige un tipo de reporte </label>
            <div className='control'>
              <div className='columns'>
                <div className='column is-narrow'>
                  <input
                    className='is-checkradio is-info is-small'
                    id='informative'
                    type='radio'
                    name='reportType'
                    checked={this.state.reportType === 'informative'}
                    onChange={() => this.selectReport('informative')} />
                  <label className='has-text-weight-normal' htmlFor='informative'>
                    <span title='Informativo'>Informativo</span>
                  </label>
                </div>

                <div className='column is-narrow'>
                  <input
                    className='is-checkradio is-info is-small'
                    id='compatible'
                    type='radio'
                    name='reportType'
                    checked={this.state.reportType === 'compatible'}
                    onChange={() => this.selectReport('compatible')} />
                  <label className='has-text-weight-normal' htmlFor='compatible'>
                    <span title='Conciliable'>Conciliable</span>
                  </label>
                </div>
              </div>

            </div>
            {this.state.reportType === 'compatible' &&
              this.state.project.cycleStatus !== 'empty' &&
              this.state.project.cycleStatus !== 'forecastCreation' &&
              this.state.project.cycleStatus !== 'salesUpload' &&

              <p className='help info-message'>En este momento no es posible crear un reporte conciliable hasta tu próximo ciclo.</p>
            }
          </div>

          {this.state.reportType === 'informative' &&
          <div className='field'>
            <label className='label'>Elige tus catálogos </label>
            <div className='control'>
              <div className='columns is-multiline forecast-catalog'>
                {
                  rules.catalogs.map((item, key) => {
                    return (
                      <div className='column is-narrow is-capitalized has-text-weight-normal' key={key}>
                        <Checkbox
                          key={key}
                          label={item.name}
                          checked={this.catalogs[item.uuid] !== undefined}
                          handleCheckboxChange={(e, value) => this.selectCatalog(value, item)}
                        />
                      </div>

                    )
                  })
                }
              </div>
            </div>
            {this.state.emptyCatalogs &&
              <p className='help is-danger'>¡Debes elegir al menos un catálogo para generar tu predicción!</p>
            }
          </div>
          }

          <div className='level'>

            <div className='level-left'>

              {this.state.minPeriod &&
              <div className='level-item'>
                <div className='field'>
                  <label className='label'>Ciclo inicial</label>
                  <div className='field is-grouped control'>
                    <div className={this.state.reportType === 'compatible' ? 'dropdown is-disabled' : 'dropdown is-hoverable'}>
                      <div className='dropdown-trigger'>
                        <button className='button is-static is-capitalized' aria-haspopup='true' aria-controls='dropdown-menu4'>
                          <span>{this.state.minPeriod.name + ' ' + this.state.minPeriod.year}</span>
                          <span className='icon is-small'>
                            <i className='fa fa-angle-down' aria-hidden='true' />
                          </span>
                        </button>
                      </div>
                      <div className='dropdown-menu' id='dropdown-menu4' role='menu'>
                        <div className='dropdown-content'>
                          {this.state.cycles && this.state.cycles.map((item, key) => {
                            return (
                              <a key={key} className={this.state.minPeriod.number === item.number &&
                                this.state.minPeriod.name === item.name &&
                                this.state.minPeriod.year === item.year ? 'dropdown-item is-capitalized is-active' : 'dropdown-item is-capitalized'}
                                onClick={() => this.setMinPeriod(item)}>
                                {item.name + ' ' + item.year}
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }

              <div className='level-item date-drop'>
                <span className='icon'>
                  <i className='fa fa-minus' />
                </span>
              </div>

              {this.state.maxPeriod &&
              <div className='level-item'>
                <div className='field'>
                  <label className='label'>Ciclo final</label>
                  <div className='field is-grouped control'>
                    <div className={this.state.reportType === 'compatible' ? 'dropdown is-disabled' : 'dropdown is-hoverable'}>
                      <div className='dropdown-trigger'>
                        <button className='button is-static is-capitalized' aria-haspopup='true' aria-controls='dropdown-menu4'>
                          <span>{this.state.maxPeriod.name + ' ' + this.state.maxPeriod.year}</span>
                          <span className='icon is-small'>
                            <i className='fa fa-angle-down' aria-hidden='true' />
                          </span>
                        </button>
                      </div>
                      <div className='dropdown-menu' id='dropdown-menu4' role='menu'>
                        <div className='dropdown-content'>
                          {this.state.cycles &&
                            this.state.cycles.slice(this.state.cycles.indexOf(this.state.minPeriod), this.state.cycles.length)
                              .map((item, key) => {
                                return (
                                  <a key={key} className={this.state.maxPeriod === item ? 'dropdown-item is-capitalized is-active' : 'dropdown-item is-capitalized'}
                                    onClick={() => this.setMaxPeriod(item)}>
                                    {item.name + ' ' + item.year}
                                  </a>
                                )
                              })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
            </div>
          </div>

          <div className='field'>
            <label className='label'>Elige uno o varios modelos </label>
            <div className='control columns is-multiline'>
              {this.state.engines && this.state.engines.map(item => {
                return (
                  <div className='column is-4' key={item.uuid}>
                    <div className='forecast-engine'>
                      <Checkbox
                        key={item.uuid}
                        checked={this.engines[item.uuid] !== undefined}
                        label={
                          <span>
                            <p className='title is-6 is-capitalized'>{item.name}</p>
                            <p className='subtitle is-6 tooltip'
                              data-tooltip={item.description || 'Sin descripción'}>{item.description || 'Sin descripción'}</p>
                          </span>
                        }
                        handleCheckboxChange={(e, value) => this.selectEngine(value, item)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            {this.state.emptyEngines &&
              <p className='help is-danger'>¡Debes elegir al menos un modelo para generar tu predicción!</p>
            }
          </div>

          <button
            className={'button generate-btn is-primary ' + this.state.generating}
            disabled={!!this.state.generating ||
              this.state.reportType === 'compatible' &&
                this.state.project.cycleStatus !== 'empty' &&
                this.state.project.cycleStatus !== 'forecastCreation' &&
                this.state.project.cycleStatus !== 'salesUpload'
              }
            onClick={() => this.generateForecast()}>
            Crear
          </button>

        </BaseModal>
      </div>
    )
  }
}

export default CreateModal
