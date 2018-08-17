import React, { Component } from 'react'
import Checkbox from '~base/components/base-checkbox'
import slugify from 'underscore.string/slugify'
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector'
import api from '~base/api'
import tree from '~core/tree'
import env from '~base/env-variables'
import cookies from '~base/cookies'
import { injectIntl } from 'react-intl'

class RegisterModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      className: '',
      step: 0,
      fade: 'fadeInRight',
      accept: false,
      registerData: {
        email: '',
        pass: '',
        passConfirm: '',
        name: '',
        lastName: '',
        job: '',
        phone: '',
        domain: '',
        orgName: '',
        type: '',
        employees: '',
        country: '',
        region: '',
        rfc: '',
        razonSocial: '',
        orgEmail: ''
      },
      errors: {
        error: false,
        email: '',
        pass: '',
        passConfirm: '',
        name: '',
        lastName: '',
        job: '',
        phone: '',
        domain: '',
        orgName: '',
        type: '',
        employees: '',
        country: '',
        region: '',
        rfc: '',
        razonSocial: '',
        orgEmail: ''
      }
    }
  }

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }

  showModal () {
    this.setState({
      className: ' is-active'
    })
  }

  hideModal () {
    this.setState({
      className: ''
    })
  }

  getForm () {
    if (this.state.step === 0) {
      return this.mailForm()
    } else if (this.state.step === 1) {
      return this.userForm()
    } else if (this.state.step === 2) {
      return this.siteForm()
    } else if (this.state.step === 3) {
      return this.orgForm()
    } else {
      return this.finish()
    }
  }

  async nextStep (step) {
    if (step < 0) {
      step = 0
      this.hideModal()
    }
    if (step > this.state.step) {
      let res = await this.sendData(step)
      if (!res) {
        return
      }
      this.setState({
        fade: 'fadeOutLeft'
      }, () => {
        setTimeout(() => {
          this.setState({
            fade: 'fadeInRight',
            step: step
          })
        }, 300)
      })
    } else {
      this.setState({
        fade: 'fadeOutRight'
      }, () => {
        setTimeout(() => {
          this.setState({
            fade: 'fadeInLeft',
            step: step
          })
        }, 300)
      })
    }
  }

  async sendData (step) {
    if (step === 1) {
      return this.validEmail()
    } else if (step === 2) {
      return this.createUser()
    } else if (step === 3) {
      return this.validateDomain()
    } else if (step === 4) {
      return this.updateOrg()
    }
  }

  async validEmail () {
    try {
      let url = '/user/validate'
      let res = await api.post(url, {email: this.state.registerData.email})
      if (res.status === 400) {
        this.setState({
          errors: {
            ...this.state.errors,
            error: true,
            email: this.formatTitle('register.emailError')
          }
        })
        return false
      }
      this.setState({
        errors: {
          ...this.state.errors,
          error: false,
          email: ''
        }
      })
      return true
    } catch (e) {
      console.log(e)
      this.setState({
        errors: {
          ...this.state.errors,
          error: true,
          email: this.formatTitle('register.emailError')
        }
      })
      return false
    }
  }

  async createUser () {
    try {
      let url = '/user'
      let res = await api.post(url,
        { email: this.state.registerData.email,
          password: this.state.registerData.pass,
          name: this.state.registerData.name + ' ' + this.state.registerData.lastName,
          job: this.state.registerData.job,
          phone: this.state.registerData.phone
        })
      if (res.status === 401) {
        this.setState({
          errors: {
            ...this.state.errors,
            error: true,
            email: this.formatTitle('register.emailError')
          }
        })
        return false
      }
      this.setState({
        errors: {
          ...this.state.errors,
          error: false,
          email: ''
        },
        user: res.user,
        jwt: res.jwt
      })

      return true
    } catch (e) {
      console.log(e)
      this.setState({
        errors: {
          ...this.state.errors,
          error: true,
          email: this.formatTitle('register.emailError')
        }
      })
      return false
    }
  }

  async validateDomain () {
    try {
      let url = '/organization/validate'
      let res = await api.post(url,
        {
          slug: this.state.registerData.domain,
          user: this.state.user.uuid
        })
      if (res.status === 400) {
        this.setState({
          errors: {
            ...this.state.errors,
            error: true,
            domain: this.formatTitle('register.domainError')
          }
        })
        return false
      }
      this.setState({
        errors: {
          ...this.state.errors,
          error: false,
          domain: ''
        },
        org: res.data,
        user: res.user
      })

      return true
    } catch (e) {
      console.log(e)
      this.setState({
        errors: {
          ...this.state.errors,
          error: true,
          domain: this.formatTitle('register.domainError')
        }
      })
      return false
    }
  }

  async updateOrg () {
    let r = this.state.registerData

    try {
      let url = '/organization/update/' + this.state.org.uuid
      let res = await api.post(url,
        {
          name: r.orgName,
          country: r.country + ' ' + r.region,
          status: 'trial',
          employees: r.employees,
          rfc: r.rfc,
          billingEmail: r.orgEmail,
          businessName: r.razonSocial,
          businessType: r.type,
          salesRep: {
            name: r.name,
            email: r.email,
            phone: r.phone
          }
        })
      if (res.status === 400) {
        this.setState({
          errors: {
            ...this.state.errors,
            error: true,
            domain: this.formatTitle('register.domainError')
          }
        })
        return false
      }

      let org = { ...this.state.org, ...res.data }

      this.setState({
        errors: {
          ...this.state.errors,
          error: false,
          domain: ''
        },
        org: org,
        rules: res.rule
      })

      cookies.set('jwt', this.state.jwt)
      cookies.set('organization', org)

      return true
    } catch (e) {
      console.log(e)
      this.setState({
        errors: {
          ...this.state.errors,
          error: true,
          domain: this.formatTitle('register.domainError')
        }
      })
      return false
    }
  }

  handleInputChange (e, input) {
    this.validateInput(e, input)
    let aux = this.state.registerData
    let val = ''

    if (input === 'country' || input === 'region') {
      val = e
    } else if (input === 'phone' || input === 'employees') {
      if (!isNaN(Number(e.target.value))) {
        val = e.target.value
      }
    } else if (input === 'domain') {
      val = slugify(e.target.value)
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

    if (input === 'email' || input === 'orgEmail') {
      if (!e.target.validity.valid) {
        aux.error = true
        aux[input] = this.formatTitle('register.validEmail')
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    if (input === 'pass') {
      if (!e.target.validity.valid) {
        aux.error = true
        aux[input] = this.formatTitle('register.validPass')
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    if (input === 'passConfirm') {
      if (!e.target.validity.valid || this.state.registerData.pass !== e.target.value) {
        aux[input] = this.formatTitle('register.validPass2')
        aux.error = true
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    if (input === 'domain') {
      if (!e.target.validity.valid) {
        aux[input] = this.formatTitle('register.validDomain')
        aux.error = true
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    if (input === 'orgName') {
      if (e.target.value === undefined || e.target.value === '') {
        aux[input] = this.formatTitle('register.validOrg')
        aux.error = true
      } else {
        aux[input] = ''
        aux.error = false
      }
    }

    if (input === 'rfc') {
      if (!e.target.validity.valid) {
        aux[input] = this.formatTitle('register.validRFC')
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

  mailForm () {
    return (
      <div className={'register__form ' + this.state.fade}>
        <h1 className='is-size-3'>
          <span className='icon is-large'>
            <i className='fa fa-3x fa-cubes' />
          </span>
        </h1>
        <h1 className='is-size-2'>
          {this.formatTitle('login.welcome')}
        </h1>
        <p className='is-size-5 pad-bottom'>
          {this.formatTitle('register.text1')}

        </p>
        <div className='content'>
          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>{this.formatTitle('login.email')}</label>
                <div className='control'>
                  <input
                    className='input'
                    type='email'
                    placeholder='correo@correo.com'
                    required
                    autoComplete='off'
                    name='email'
                    pattern='[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$'
                    value={this.state.registerData.email}
                    onChange={(e) => this.handleInputChange(e, 'email')} />
                </div>
                <p className='help is-danger'>{this.state.errors.email}</p>
              </div>
              <div className='field'>
                <label className='label'>{this.formatTitle('login.pass')}</label>
                <div className='control'>
                  <input
                    pattern='^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-.]).{8,}$'
                    className='input'
                    type='password'
                    placeholder={this.formatTitle('register.validPass')}
                    autoComplete='off'
                    required
                    name='pass'
                    value={this.state.registerData.pass}
                    onChange={(e) => this.handleInputChange(e, 'pass')} />
                </div>
                <p className='help is-danger'>{this.state.errors.pass}</p>
              </div>
              <div className='field'>
                <label className='label'>{this.formatTitle('profile.confirmPass')}</label>
                <div className='control'>
                  <input
                    pattern='^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-.]).{8,}$'
                    className='input'
                    type='password'
                    placeholder={this.formatTitle('profile.confirmPass')}
                    autoComplete='off'
                    required
                    name='passConfirm'
                    value={this.state.registerData.passConfirm}
                    onChange={(e) => this.handleInputChange(e, 'passConfirm')} />
                </div>
                <p className='help is-danger'>{this.state.errors.passConfirm}</p>
              </div>
              <div className='field'>
                <div className='columns'>
                  <div className='column is-narrow'>
                    <Checkbox
                      hideLabel
                      checked={this.state.accept}
                      handleCheckboxChange={(e, value) => {
                        this.setState({ accept: value })
                      }}
                    />
                  </div>
                  <div className='column is-narrow'>
                    <div className='accept__label'>
                      <strong>{this.formatTitle('register.accept')} <a className='has-text-primary' href='/privacy' target='_blank'>{this.formatTitle('landing.privacy')}</a> {this.formatTitle('register.use')}</strong>
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

  userForm () {
    return (
      <div className={'register__form ' + this.state.fade}>
        <h1 className='is-size-3'>
          <span className='icon is-large'>
            <i className='fa fa-3x fa-user' />
          </span>
        </h1>
        <h1 className='is-size-2'>

          {this.formatTitle('register.userFormTitle')}
        </h1>
        <p className='is-size-5 pad-bottom'>
          {this.formatTitle('register.userFormTitle')}
        </p>
        <br />
        <br />
        <div className='content'>
          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>
                  {this.formatTitle('profile.name')} *
                  </label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder={this.formatTitle('profile.name')}
                    autoComplete='off'
                    required
                    name='name'
                    value={this.state.registerData.name}
                    onChange={(e) => this.handleInputChange(e, 'name')} />
                </div>
                <p className='help is-danger'>{this.state.errors.name}</p>
              </div>
              <div className='field'>
                <label className='label'>
                  {this.formatTitle('profile.job')}
                </label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder={this.formatTitle('profile.job')}
                    autoComplete='off'
                    name='job'
                    value={this.state.registerData.job}
                    onChange={(e) => this.handleInputChange(e, 'job')} />
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label'>{this.formatTitle('profile.lastName')}  *</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder={this.formatTitle('profile.lastName')}
                    autoComplete='off'
                    required
                    name='lastName'
                    value={this.state.registerData.lastName}
                    onChange={(e) => this.handleInputChange(e, 'lastName')} />
                </div>
                <p className='help is-danger'>{this.state.errors.lastName}</p>
              </div>
              <div className='field'>
                <label className='label'>
                  {this.formatTitle('profile.phone')}
                </label>
                <div className='control'>
                  <input
                    className='input'
                    type='tel'
                    placeholder='01 555 555 555'
                    autoComplete='off'
                    required
                    name='phone'
                    pattern='[0-9]{15}'
                    value={this.state.registerData.phone}
                    onChange={(e) => this.handleInputChange(e, 'phone')} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  siteForm () {
    return (
      <div className={'register__form ' + this.state.fade}>
        <h1 className='is-size-3'>
          <span className='icon is-large'>
            <i className='fa fa-3x fa-fort-awesome' />
          </span>
        </h1>
        <h1 className='is-size-2'>
          {this.formatTitle('register.siteFormTitle')}

        </h1>
        <p className='is-size-5 pad-bottom'>
          {this.formatTitle('register.siteFormSub')}

        </p>
        <div className='content'>
          <br />
          <br />
          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>
                  {this.formatTitle('register.text2')}

                </label>
                <div className='control'>
                  <div className='field has-addons'>
                    <p className='control is-expanded'>
                      <input
                        className='input'
                        type='text'
                        placeholder='org-url'
                        autoComplete='off'
                        required
                        name='domain'
                        pattern='[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?'
                        value={this.state.registerData.domain}
                        onChange={(e) => this.handleInputChange(e, 'domain')} />
                    </p>
                    <p className='control'>
                      <a className='button is-static'>
                        .orax.io
                      </a>
                    </p>
                  </div>
                </div>
                <p className='help is-danger'>{this.state.errors.domain}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  orgForm () {
    return (
      <div className={'register__form ' + this.state.fade}>
        <h1 className='is-size-3'>
          <span className='icon is-large'>
            <i className='fa fa-3x fa-building-o' />
          </span>
        </h1>
        <h1 className='is-size-2'>
          {this.formatTitle('register.orgFormTitle')}

        </h1>
        <p className='is-size-5 pad-bottom'>
          {this.formatTitle('register.orgFormSub')}

        </p>

        <div className='content with-scroll'>
          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>
                  {this.formatTitle('profile.name')} *</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder={this.formatTitle('landing.contactOrg')}
                    autoComplete='off'
                    required
                    name='orgName'
                    value={this.state.registerData.orgName}
                    onChange={(e) => this.handleInputChange(e, 'orgName')} />
                </div>
                <p className='help is-danger'>{this.state.errors.orgName}</p>
              </div>
            </div>
          </div>

          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>{this.formatTitle('register.businessType')}</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder={this.formatTitle('register.businessType')}
                    autoComplete='off'
                    required
                    name='type'
                    value={this.state.registerData.type}
                    onChange={(e) => this.handleInputChange(e, 'type')} />
                </div>
              </div>
              <div className='field'>
                <label className='label'>{this.formatTitle('landing.contactCountry')}</label>
                <div className='control'>
                  <CountryDropdown
                    defaultOptionLabel={this.formatTitle('landing.contactCountry')}
                    value={this.state.registerData.country}
                    id='my-country-field-id'
                    name='my-country-field'
                    classes='input'
                    onChange={(e) => { this.handleInputChange(e, 'country') }} />
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label'>{this.formatTitle('landing.contactNum')}</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder={this.formatTitle('landing.contactNum')}
                    autoComplete='off'
                    required
                    name='employees'
                    value={this.state.registerData.employees}
                    onChange={(e) => this.handleInputChange(e, 'employees')} />
                </div>
              </div>
              <div className='field'>
                <label className='label'>
                  {this.formatTitle('register.region')}
                </label>
                <div className='control'>
                  <RegionDropdown
                    blankOptionLabel={this.formatTitle('register.region')}
                    defaultOptionLabel={this.formatTitle('register.region')}
                    country={this.state.registerData.country}
                    value={this.state.registerData.region}
                    name='my-region-field-name'
                    id='my-region-field-id'
                    classes='input'
                    onChange={(e) => { this.handleInputChange(e, 'region') }} />
                </div>
              </div>
            </div>
          </div>

          <hr />

          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>
                  {this.formatTitle('organizationBilling.rfc')}
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
                    onChange={(e) => this.handleInputChange(e, 'rfc')} />
                </div>
                <p className='help is-danger'>{this.state.errors.rfc}</p>
              </div>
            </div>
          </div>

          <div className='columns is-centered'>
            <div className='column'>
              <div className='field'>
                <label className='label'>
                  {this.formatTitle('organizationBilling.businessName')}
                </label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder={this.formatTitle('organizationBilling.businessNamePlaceholder')}
                    autoComplete='off'
                    name='razonSocial'
                    value={this.state.registerData.razonSocial}
                    onChange={(e) => this.handleInputChange(e, 'razonSocial')} />
                </div>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label'>
                  {this.formatTitle('organizationBilling.billingEmail')}
                </label>
                <div className='control'>
                  <input
                    className='input'
                    type='email'
                    placeholder={this.formatTitle('organizationBilling.billingEmailPlaceholder')}
                    autoComplete='off'
                    name='orgEmail'
                    value={this.state.registerData.orgEmail}
                    onChange={(e) => this.handleInputChange(e, 'orgEmail')} />
                </div>
                <p className='help is-danger'>{this.state.errors.orgEmail}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  finish () {
    return (
      <div className={'register__form ' + this.state.fade}>
        <h1 className='is-size-3'>
          <span className='icon is-large'>
            <i className='fa fa-3x fa-birthday-cake' />
          </span>
        </h1>
        <h1 className='is-size-2 pad-bottom'>
          {this.formatTitle('register.congrat')}
        </h1>
        <div className='content'>
          <p className='is-size-5'>
            {this.formatTitle('register.your')} <strong>{this.formatTitle('register.30days')} </strong>
            {this.formatTitle('register.request')}
          </p>

        </div>
      </div>
    )
  }

  indicators () {
    let indicators = []
    for (let i = 0; i < 4; i++) {
      if (i === this.state.step) {
        indicators.push(<span key={i} className='indicator indicator__active' />)
      } else {
        indicators.push(<span key={i} className='indicator' />)
      }
    }
    return (
      <div className='step-indicators'>
        {indicators}
      </div>
    )
  }

  continue () {
    let r = this.state.registerData
    let e = this.state.errors
    if (e.error) {
      return false
    }
    if (this.state.step === 0) {
      if (r.email === '' || e.email !== '') {
        return false
      }
      if (r.pass === '' || e.pass !== '') {
        return false
      }
      if (r.passConfirm === '' || e.passConfirm !== '') {
        return false
      }
      if (!this.state.accept) {
        return false
      }
    } else if (this.state.step === 1) {
      if (r.name === '' || e.name !== '') {
        return false
      }
      if (r.lastName === '' || e.lastName !== '') {
        return false
      }
    } else if (this.state.step === 2) {
      if (r.domain === '' || e.domain !== '') {
        return false
      }
    } else if (this.state.step === 3) {
      if (r.orgName === '') {
        return false
      }
    }

    return true
  }

  finishUp () {
    const hostname = window.location.hostname
    const hostnameSplit = hostname.split('.')
    tree.set('loggedIn', true)
    tree.commit()
    if (env.ENV === 'production') {
      if (hostname.indexOf('stage') >= 0 || hostname.indexOf('staging') >= 0) {
        const newHostname = hostnameSplit.slice(-3).join('.')
        window.location = `//${this.state.org.slug}.${newHostname}/rules`
      } else {
        const newHostname = hostnameSplit.slice(-2).join('.')
        window.location = `//${this.state.org.slug}.${newHostname}/rules`
      }
    } else {
      const baseUrl = env.APP_HOST.split('://')
      window.location = baseUrl[0] + '://' + this.state.org.slug + '.' + baseUrl[1] + '/rules'
    }
  }

  render () {
    return (
      <div>
        <div>
          <div className={'modal register__modal' + this.props.modalClass}>
            <div className='modal-background' />
            <div className='modal-content'>
              <section className='register_section'>
                {this.getForm()}
              </section>
              <center>
                <br />
                <br />
                {this.state.step !== 4 &&
                <div>
                  <div className='field'>
                    <button className='button is-primary is-inverted is-medium'
                      disabled={this.state.step === 0}
                      onClick={() => { this.nextStep(this.state.step - 1) }}>
                      {this.formatTitle('register.back')}
                    </button>
                    <button className='button is-primary is-medium'
                      disabled={!this.continue()}
                      onClick={() => { this.nextStep(this.state.step + 1) }}>
                      {this.formatTitle('register.next')}
                    </button>
                  </div>
                  {this.indicators()}
                </div>
                }
                {this.state.step === 4 &&
                  <div>
                    <div className='field'>
                      <button className='button is-primary is-medium'
                        disabled={!this.continue()}
                        onClick={() => { this.finishUp() }}>
                        {this.formatTitle('register.start')}
                      </button>
                    </div>
                  </div>
                }
              </center>
            </div>

            <button className='modal-close is-large has-text-dark' aria-label='close' onClick={() => { this.props.hideModal() }} />
          </div>
        </div>
      </div>
    )
  }
}

export default injectIntl(RegisterModal)
