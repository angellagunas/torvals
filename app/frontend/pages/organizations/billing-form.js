import React, { Component } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import api from '~base/api'

class BillingForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      registerData: {
        phone: this.props.org.salesRep.phone || '',
        country: this.props.org.country || '',
        rfc: this.props.org.rfc || '',
        razonSocial: this.props.org.businessName || '',
        orgEmail: this.props.org.billingEmail || ''
      },
      errors: {
        error: false,
        phone: '',
        country: '',
        rfc: '',
        razonSocial: '',
        orgEmail: ''
      },
      edit: false,
      org: this.props.org,
      isLoading: '',
      apiMsg: '',
      apiMsgclass: 'is-hidden'
    }
  }

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }

  handleInputChange (e, input) {
    this.validateInput(e, input)
    let aux = this.state.registerData
    let val = ''

    if (input === 'phone') {
      if (!isNaN(Number(e.target.value))) {
        val = e.target.value
      }
    } else {
      val = e.target.value
    }

    aux[input] = val
    this.setState({
      registerData: aux
    })
  }

  validateInput (e, input) {
    let aux = this.state.errors

    if (input === 'orgEmail') {
      if (!e.target.validity.valid) {
        aux.error = true
        aux[input] = this.formatTitle('organizationBilling.billingEmailMsgInvalid')
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    if (input === 'rfc') {
      if (!e.target.validity.valid) {
        aux[input] = this.formatTitle('organizationBilling.rfcMsgInvalid')
        aux.error = true
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    this.setState({
      errors: aux
    })
  }

  async toggleEdit (e) {
    e.preventDefault()

    if (this.state.edit) {
      await this.updateOrg()
    }

    this.setState({
      edit: !this.state.edit
    })
  }

  async updateOrg () {
    let r = this.state.registerData
    this.setState({
      isLoading: ' is-loading'
    })
    try {
      let url = '/organization/update/' + this.state.org.uuid
      let res = await api.post(url,
        {
          name: this.state.org.name,
          status: this.state.org.status,
          employees: this.state.org.employees,
          businessName: this.state.org.name,
          country: r.country,
          rfc: r.rfc,
          billingEmail: r.orgEmail,
          businessType: r.businessType,
          salesRep: {
            name: this.state.org.salesRep.name,
            email: this.state.org.salesRep.email,
            phone: r.phone
          }
        })

      let org = { ...this.state.org, ...res.data }

      this.setState({
        errors: {
          ...this.state.errors,
          error: false
        },
        org: org,
        isLoading: '',
        apiMsg: this.formatTitle('organizationBilling.apiMsgSuccess'),
        apiMsgclass: 'message is-success'
      })

      setTimeout(() => {
        this.setState({
          apiMsg: '',
          apiMsgclass: 'is-hidden'
        })
      }, 3000)
      return true
    } catch (e) {
      this.setState({
        isLoading: '',
        apiMsg: this.formatTitle('organizationBilling.apiMsgError') + e.message,
        apiMsgclass: 'message is-danger'
      })
      return false
    }
  }

  render () {
    return (
      <div>
        {!this.props.isModal &&
          <h1 className='subtitle has-text-weight-bold'>
            <FormattedMessage
              id='organizationBilling.title'
              defaultMessage={`Datos de facturación`}
            />
          </h1>
        }
        <div className='columns'>
          <div className={this.props.isModal ? 'column' : 'column is-6'}>
            <div className='card'>
              <div className='card-content'>
                <form>
                  <div className='field'>
                    <label className='label'>
                      <FormattedMessage
                        id='organizationBilling.rfc'
                        defaultMessage={`RFC`}
                      />
                    </label>
                    <div className='control'>
                      <input
                        className='input'
                        type='text'
                        placeholder={this.formatTitle('organizationBilling.rfc')}
                        autoComplete='off'
                        name='rfc'
                        pattern='[A-Z&Ñ]{3,4}[0-9]{2}(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]'
                        value={this.state.registerData.rfc}
                        onChange={(e) => this.handleInputChange(e, 'rfc')}
                        disabled={!this.state.edit} />
                    </div>
                    <p className='help is-danger'>{this.state.errors.rfc}</p>
                  </div>

                  <div className='field'>
                    <label className='label'>
                      <FormattedMessage
                        id='organizationBilling.billingEmail'
                        defaultMessage={`Correo de facturación`}
                      />
                    </label>
                    <div className='control'>
                      <input
                        className='input'
                        type='email'
                        placeholder={this.formatTitle('organizationBilling.billingEmailPlaceholder')}
                        autoComplete='off'
                        name='orgEmail'
                        value={this.state.registerData.orgEmail}
                        onChange={(e) => this.handleInputChange(e, 'orgEmail')}
                        disabled={!this.state.edit} />
                    </div>
                    <p className='help is-danger'>{this.state.errors.orgEmail}</p>
                  </div>

                  <div className='field'>
                    <label className='label'>
                      <FormattedMessage
                        id='organizationBilling.businessName'
                        defaultMessage={`Razón Social`}
                      />
                    </label>
                    <div className='control'>
                      <input
                        className='input'
                        type='text'
                        placeholder={this.formatTitle('organizationBilling.businessNamePlaceholder')}
                        autoComplete='off'
                        name='razonSocial'
                        value={this.state.registerData.razonSocial}
                        onChange={(e) => this.handleInputChange(e, 'razonSocial')}
                        disabled={!this.state.edit} />
                    </div>
                  </div>

                  <div className='field'>
                    <label className='label'>
                      <FormattedMessage
                        id='organizationBilling.phone'
                        defaultMessage={`Teléfono`}
                      />
                    </label>
                    <div className='control'>
                      <input
                        className='input'
                        type='tel'
                        placeholder={this.formatTitle('organizationBilling.phonePlaceholder')}
                        autoComplete='off'
                        required
                        name='phone'
                        pattern='[0-9]{10}'
                        value={this.state.registerData.phone}
                        onChange={(e) => this.handleInputChange(e, 'phone')}
                        disabled={!this.state.edit} />
                    </div>
                  </div>

                  <div className='field'>
                    <label className='label'>
                      <FormattedMessage
                        id='organizationBilling.country'
                        defaultMessage={`País`}
                      />
                    </label>
                    <div className='control'>
                      <input
                        className='input'
                        type='text'
                        placeholder={this.formatTitle('organizationBilling.country')}
                        autoComplete='off'
                        name='country'
                        value={this.state.registerData.country}
                        onChange={(e) => this.handleInputChange(e, 'country')}
                        disabled={!this.state.edit} />
                    </div>
                  </div>

                  <div className='field button-right'>
                    <button className={'button is-primary' + this.state.isLoading}
                      onClick={(e) => {
                        this.toggleEdit(e)
                      }}
                      disabled={!!this.state.isLoading}
                    >
                      {this.state.edit
                        ? this.formatTitle('organizationBilling.btnSave')
                        : this.formatTitle('organizationBilling.btnEdit')
                      }
                    </button>
                  </div>

                </form>

                <div className={'has-10-margin-top ' + this.state.apiMsgclass}>
                  <div className='message-body is-size-7 has-text-centered'>
                    {this.state.apiMsg}
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

export default injectIntl(BillingForm)