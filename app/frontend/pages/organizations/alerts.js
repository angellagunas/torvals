import React, { Component } from 'react'
import { BaseTable } from '~base/components/base-table'
import { FormattedMessage, injectIntl } from 'react-intl'
import Multiselect from '~base/components/base-multiselect'
import api from '~base/api'
import tree from '~core/tree'

class Alerts extends Component {
  constructor (props) {
    super(props)
    this.state = {
      alerts: [],
      alertsFilter: [],
      alertModal: '',
      searchTerm: '',
      selectedUsers: [],
      users: []   ,
      alertSelected: {}   
    }
  }
  
  
  componentWillMount () {
    this.getUsers()
    this.getAlerts()
  }
  
  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }
  
  getColumns(){
    return(
      [
        {
          'title': this.formatTitle('organizationAlerts.tableAlert'),
          'default': 'N/A',
          formatter: (row) => {
            return String(row.name)
          }
        },
        {
          'title': this.formatTitle('organizationAlerts.tableType'),
          'default': 'N/A',
          formatter: (row) => {
            return String(row.type)
          }
        },
        {
          'title': this.formatTitle('organizationAlerts.tableDescription'),
          'property': 'description',
          'default': 'N/A'
        },
        {
          'title': this.formatTitle('organizationAlerts.tableEnabled'),
          'property': 'type',
          'default': 'N/A',
          className: 'has-text-centered',
          formatter: (row) => {
            if(this.isInOrg(row.uuid) !== -1){
              row.status = 'active'
              return (
                <span className='icon has-text-success'>
                  <i className='fa fa-check fa-2x'/>
                </span>
              )
            }
            else {
              row.status = 'inactive'
              return (
                <span className='icon has-text-danger'>
                  <i className='fa fa-times fa-2x' />
                </span>
              )
            }
          }
        },
        {
          'title': this.formatTitle('organizationAlerts.tableActions'),
          formatter: (row) => {
            if(!row.default){
              return (
                <a className='button is-primary' onClick={() => this.selectAlert(row)}>
                  <span className='icon is-small' title='Editar'>
                    <i className='fa fa-pencil' />
                  </span>
                </a>
              )
            }
          }
        }
      ]
    )
  }

  selectAlert(alert){
    let index = this.isInOrg(alert.uuid)
    let users = index !== -1 ? this.state.orgAlerts[index].users : []
    this.setState({
      alertSelected: alert,
      selectedUsers: users
    }, () => {
    this.toggleModal()
    })
  }

  toggleModal() {
    this.setState({
      alertModal: this.state.alertModal === '' ? 'is-active' : ''
    })
  }

  searchOnChange = (e) => {
    this.setState({
      searchTerm: e.target.value
    }, () => this.searchDatarows())
  }

  async searchDatarows() {
    if (this.state.searchTerm === '') {
      this.setState({
        alertsFilter: this.state.alerts
      })

      return
    }

    const items = this.state.alerts.filter((item) => {
      const regEx = new RegExp(this.state.searchTerm, 'gi')
      const searchStr = `${item.name} ${item.type}`

      if (regEx.test(searchStr))
        return true

      return false
    })

    await this.setState({
      alertsFilter: items
    })
  }

  async availableOnClick(uuid) {
    this.setState({
      saving: true
    })

    let selected = this.state.selectedUsers
    let user = this.state.users.find(item => { return item.uuid === uuid })

    if (selected.findIndex(item => { return item.uuid === uuid }) !== -1) {
      return
    }

    selected.push(user)

    const url = '/app/alerts/'+ this.props.org.uuid + '/alert/' + this.state.alertSelected.uuid + '/add-user'
    let res = await api.post(url,
      {
        user: uuid
      }
    )
    tree.set('organization', res.data)
    tree.commit()

    setTimeout(() => {
      this.setState({
        saving: false,
        saved: true
      })
    }, 300)
  }

  async assignedOnClick(uuid) {
    this.setState({
      saving: true
    })

    let index = this.state.selectedUsers.findIndex(item => { return item.uuid === uuid })
    let selected = this.state.selectedUsers

    if (index === -1) {
      return
    }

    selected.splice(index, 1)

    this.setState({
      selectedUsers: selected
    })

    const url = '/app/alerts/' + this.props.org.uuid + '/alert/' + this.state.alertSelected.uuid + '/remove-user'
    
    let res = await api.post(url,
      {
        user: uuid
      }
    )
 
    tree.set('organization', res.data)
    tree.commit()

    setTimeout(() => {
      this.setState({
        saving: false,
        saved: true
      })
    }, 300)
  }

  toggleActive(){
    this.setState({
      saving: true
    })
    if(this.state.alertSelected.status === 'active'){
      this.alertOff()
    }else{
      this.alertOn()
    }
    
    setTimeout(() => {
      this.setState({
        saving: false,
        saved: true
      })
    }, 300)
  }

  async alertOn() {
    var url = '/app/alerts/' + this.props.org.uuid
    try {
      const body = await api.post(url, {alert: this.state.alertSelected.uuid})
      if (body.data){
        this.setState({ 
          alertSelected: {...this.state.alertSelected, status: 'active'},
        }, () => {
          this.getAlerts()
        })
        
        tree.set('organization', body.data)
        tree.commit()
      }
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  async alertOff() {
    var url = '/app/alerts/delete/' + this.props.org.uuid
    try {
      const body = await api.post(url, { alert: this.state.alertSelected.uuid })
      if (body.data) {
        this.setState({
          alertSelected: {
            ...this.state.alertSelected,
            status: 'inactive'
          }
        }
          , () => {
            this.getAlerts()
          })
        tree.set('organization', body.data)
        tree.commit()
      }
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  async getUsers(){
    var url = '/app/users'
    try {
      const body = await api.get(url)
      this.setState({
        users: body.data
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  async getAlerts() {
    var url = '/app/alerts/' + this.props.org.uuid
    try {
      const body = await api.get(url)
      this.setState({
        alerts: body.data.alerts,
        orgAlerts: body.data.orgAlerts
      }, () => {
        this.searchDatarows()
      })
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true
      })
    }
  }

  getSavingMessage() {
    let { saving, saved } = this.state

    if (saving) {
      return (
        <p style={{ fontWeight: '200', color: 'grey' }}>
          <FormattedMessage
            id="user.saving"
            defaultMessage={`Guardando`}
          /> <span style={{ paddingLeft: '5px' }}><i className='fa fa-spinner fa-spin' /></span>
        </p>
      )
    }

    if (saved) {
      if (this.savedTimeout) {
        clearTimeout(this.savedTimeout)
      }

      this.savedTimeout = setTimeout(() => {
        this.setState({
          saved: false
        })
      }, 500)

      return (
        <p style={{ fontWeight: '200', color: 'grey' }}>
          <FormattedMessage
            id="user.saved"
            defaultMessage={`Guardado`}
          />
        </p>
      )
    }
  }

  isInOrg(alert){
    let index = this.state.orgAlerts.findIndex(a => { 
      return a.alert.uuid === alert
    })
    return index
  }

  render () {
    
    const availableList = this.state.users.filter(item => {
      return (this.state.selectedUsers.findIndex(user => {
        return user.uuid === item.uuid
      }) === -1)
    })

    return (
      <div>
        <div className='level'>
          <div className='level-left'>
            <div className='level-item'>
              <h1 className='subtitle has-text-weight-bold'>
                <FormattedMessage
                  id='organizationAlerts.title'
                  defaultMessage={`Búsqueda general`}
                />
              </h1>
            </div>
          </div>
          <div className='level-right'>
            <div className='level-item'>
              <div className='field'>
                <label className='label'>
                  <FormattedMessage
                    id='dashboard.searchText'
                    defaultMessage={`Búsqueda general`}
                  />
                </label>
                <div className='control has-icons-right'>
                  <input
                    className='input'
                    type='text'
                    value={this.state.searchTerm}
                    onChange={this.searchOnChange}
                    placeholder={this.formatTitle('dashboard.searchText')}
                  />

                  <span className='icon is-small is-right'>
                    <i className='fa fa-search fa-xs' />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <BaseTable
          className='aprobe-table is-fullwidth is-margin-top-20'
          data={this.state.alertsFilter}
          columns={this.getColumns()}
        />

        <div className={'modal ' + this.state.alertModal}>
          <div className='modal-background' onClick={() => {this.toggleModal()}}></div>
          <div className='modal-card'>
            <header className='modal-card-head'>
              <p className='modal-card-title'>{this.state.alertSelected.name}</p>
              <button className='delete' aria-label='close' onClick={() => { this.toggleModal() }}></button>
            </header>
            <section className='modal-card-body'>
              <div className='level'>
                <div className='level-left'>
                  <div className='level-item'>
                    <div className='field'>
                      <input id='switchRtlExample'
                        type='checkbox'
                        name='switchRtlExample'
                        className='switch is-rtl is-info'
                        checked={this.state.alertSelected.status === 'active'}
                        onChange={(e) => this.toggleActive(e.target.value)}
                      />
                      <label htmlFor='switchRtlExample'>
                        <FormattedMessage
                          id='organizationAlerts.activateBtn'
                          defaultMessage={`Activar`}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className='level-right'>
                  <div className='level-item'>
                    {this.getSavingMessage()}
                  </div>
                </div>
              </div>
              {this.state.alertSelected.status === 'active' &&
            <Multiselect
                availableTitle={this.formatTitle('organizationAlerts.multiselectAvailableTitle')}
                assignedTitle={this.formatTitle('organizationAlerts.multiselectAssignedTitle')}
                assignedList={this.state.selectedUsers}
                availableList={availableList}
                dataFormatter={(item) => { return item.name || 'N/A' }}
                availableClickHandler={(user) => this.availableOnClick(user)}
                assignedClickHandler={(user) => this.assignedOnClick(user)}
                disabled={false}
              />
    }
            </section>
          </div>
        </div>
      </div>
    )
  }
}

export default injectIntl(Alerts)