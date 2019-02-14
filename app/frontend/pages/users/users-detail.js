import React, { Component } from 'react'
import Select from 'react-select'
import { FormattedMessage, injectIntl } from 'react-intl'
import { BranchedPaginatedTable } from '~base/components/base-paginated-table'
import api from '~base/api'
import DeleteButton from '~base/components/base-deleteButton'
import tree from '~core/tree'
import UserDetail from './detail'
import CreateUser from './create'
import CreateSendEmail from './create-send-email'
import { testRoles } from '~base/tools'
import env from '~base/env-variables'
import { toast } from 'react-toastify'

class UsersDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      sendingEmail: [],
      searchTerm: '',
      userSelected: tree.get('userDetail') || undefined,
      userRoles: [],
      selectedRole: '',
      modalClassName: '',
      modalSendEmail: '',
      isDownloading: false,
      downloadInfo: '',
      usersList: [],
      canCreate: 'admin, orgadmin, analyst, consultor-level-3, manager-level-2, manager-level-3'
    }
  }

  componentDidMount() {
    this.getRoles()
  }

  async getRoles() {
    const roles = await api.get('/app/roles/')

    this.setState({
      userRoles: roles
    })
  }

  notify(message = '', timeout = 5000, type = toast.TYPE.INFO) {
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

  async resetOnClick (email) {
    await this.setState({
      resetLoading: true,
      resetText: this.formatTitle('user.resetText1'),
      resetClass: 'button is-info',
      sendingEmail: [
        ...this.state.sendingEmail,
        email
      ]
    })

    var url = '/user/reset-password'
    try {
      await api.post(url, {email})
      const userIndex = this.state.sendingEmail.findIndex(userEmail => userEmail === email)
      if (userIndex !== -1) {
        this.state.sendingEmail.splice(userIndex, 1)
      }
      console.log('EMAIL', this.state.sendingEmail)
      setTimeout(() => {
        this.setState({
          resetLoading: true,
          resetText: this.formatTitle('user.resetText2'),
          resetClass: 'button is-success',
          sendingEmail: this.state.sendingEmail
        })

        this.notify('Se ha enviado el correo',5000, toast.TYPE.SUCCESS)

      }, 3000)
    } catch (e) {
      await this.setState({
        resetLoading: true,
        resetText: this.formatTitle('user.resetText3'),
        resetClass: 'button is-danger'
      })
    }

    setTimeout(() => {
      this.setState({
        resetLoading: false,
        resetText: this.formatTitle('user.resetText'),
        resetClass: 'button is-danger'
      })
    }, 10000)
  }

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
  }

  getColumns () {
    return [
      {
        'title': this.formatTitle('user.formName'),
        'property': 'name',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': this.formatTitle('user.formEmail'),
        'property': 'email',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': this.formatTitle('user.formRole'),
        'property': 'role',
        'default': 'N/A',
        'sortable': true
      },
      {
        'title': this.formatTitle('user.groups'),
        'property': 'groups',
        'default': 'N/A',
        'sortable': true,
        formatter: (row) => {
          if (row.groups.length > 2) {
            return (
              <div>
                {row.groups[0].name}
                <br />
                {row.groups[1].name}
                <br />
                {row.groups.length - 2} <FormattedMessage
                  id='user.detailMore'
                  defaultMessage={`más`}
                />
              </div>
            )
          } else if (row.groups.length > 1) {
            return (
              <div>
                {row.groups[0].name}
                <br />
                {row.groups[1].name}
              </div>
            )
          } else if (row.groups.length > 0) {
            return (
              <div>
                {row.groups[0].name}
              </div>
            )
          }
        }
      },
      {
        'title': this.formatTitle('user.tableActions'),
        formatter: (row) => {
          const deleteObject = async function () {
            var url = '/app/users/' + row.uuid
            await api.del(url)

            const cursor = tree.get('users-list')
            const users = await api.get('/app/users/')
            tree.set('users-list', {
              page: cursor.page,
              totalItems: users.total,
              items: users.data,
              pageLength: cursor.pageLength
            })
            tree.commit()
            await updateStep()
          }
          const updateStep = async function () {
            try {
              let user = tree.get('user')
              if (user.currentOrganization.wizardSteps.users) {
                return
              }
              let url = '/app/organizations/' + user.currentOrganization.uuid + '/step'

              let res = await api.post(url, {
                step: {
                  name: 'users',
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

          const currentUser = tree.get('user')
          var disabledActions = false
          if (row.roleDetail && currentUser) {
            disabledActions = row.roleDetail.priority <= currentUser.currentRole.priority
          }

          if (currentUser.currentRole.slug === 'consultor-level-3') {
            disabledActions = false
          }

          if (currentUser.currentRole.slug === 'orgadmin') {
            disabledActions = false
          }

          return (
            <div className='field is-grouped'>
              <div className='control'>
                {disabledActions
                ? <a className='button is-primary' onClick={() => this.selectUser(row)}>
                  <span className='icon is-small' title={this.formatTitle('user.detail')}>
                    <i className='fa fa-eye' />
                  </span>
                </a>
                  : <a className='button is-primary' onClick={() => this.selectUser(row)}>
                    <span className='icon is-small' title={this.formatTitle('user.edit')}>
                      <i className='fa fa-pencil' />
                    </span>
                  </a>
              }
              </div>
              <div className='control'>
              {env.EMAIL_SEND && (
                <button
                    className={`button is-warning ${this.state.sendingEmail.includes(row.email) ? ' is-loading': ''}`}
                    disabled={this.state.sendingEmail === row.email}
                    onClick={() => this.resetOnClick(row.email)}>
                  <span className='icon is-small' title="Reset Password">
                    <i className='fa fa-envelope' />
                  </span>
                </button>
              )}
              </div>
              <div className='control'>
                {currentUser.uuid !== row.uuid && !disabledActions && (
                <DeleteButton
                  iconOnly
                  icon='fa fa-trash'
                  objectName={this.formatTitle('user.deleteObj')}
                  titleButton={this.formatTitle('user.delete')}
                  objectDelete={deleteObject}
                  message={`${this.formatTitle('user.deleteMsg')} ${row.name} ?`}
                />
              )}
              </div>
            </div>
          )
        }
      }
    ]
  }

  searchOnChange (e) {
    let value = e.target.value
    this.setState({
      searchTerm: value
    })
  }

  selectUser (user) {
    tree.set('userDetail', user)
    tree.commit()
    this.setState({
      userSelected: user
    })
  }

  showModal () {
    this.setState({
      modalClassName: ' is-active'
    })
  }

  hideModal (e) {
    this.setState({
      modalClassName: ''
    })
  }

  finishUp (object) {
    this.setState({
      modalClassName: ''
    })

    this.selectUser(object)
  }

  showModalEmail(){
    this.setState({
      modalSendEmail: ' is-active'
    })
  }

  hideModalEmail(e){
    this.setState({
      modalSendEmail: ''
    })
  }

  finishUpEmail (object) {
    this.setState({
      modalSendEmail: ''
    })
  }

  setSelectedRole(option) {
    const selection = option === null ? '' : option

    this.setState({
      selectedRole: selection
    })
  }

  async getUsers(){
    try{
      const users = await api.get(
        '/app/users',
        {
          start: 0,
          limit: 500
        }
      )
      await this.download(users.data)
      }catch(err){
        console.log(err)
      }
  }


  async download(users) {
    try {
      //const { dataRows, projectSelected, filters, formData } = this.state
      //const cycle = filters.cycles.find(item => item.cycle === formData.cycle) || {}

      const csv = ['Usuario,Email,Rol,Verificado,Email Validado,Grupos']
      for (let user of users) {
        if(user.isOperationalUser) continue

        let verified = user.isVerified? 'Verificado': 'No Verificado'
        let validate = user.validEmail? 'Si': 'No'
        let userRole = this.state.userRoles.data.find(item => item._id === user.organizations.role)
        csv.push([
          user.name || '',
          user.email,
          userRole.name,
          verified,
          validate,
          (user.groups || []).map(group => group.name || '').join(' ')

        ].join(','))
      }

      // Download CSV file
      this.downloadCSV(csv.join('\n'), `Reporte-Usuario.csv`)
    } catch (error) {
      console.log(error)
      this.setState({
        isDownloading: false,
      })
      this.notify('¡No se pudo completar la descarga!', 5000, toast.TYPE.ERROR)
    }
  }

  downloadCSV(csv, filename) {
    // CSV file
    const csvFile = new Blob(['\ufeff', csv], {type: 'text/csv'})

    // Download link
    let downloadLink = document.createElement('a')

    // File name
    downloadLink.download = filename

    // Create a link to the file
    downloadLink.href = window.URL.createObjectURL(csvFile)

    // Hide download link
    downloadLink.style.display = 'none'

    // Add the link to DOM
    document.body.appendChild(downloadLink)

    // Click download link
    downloadLink.click()

    this.setState({
      isDownloading: false
    })
  }



  slectionRoleComponent() {
    if (this.state.userRoles && this.state.userRoles.data) {
      let roles = this.state.userRoles.data.map(role => ({
        value: role.uuid,
        label: role.name
      }))

    return(
      <Select
        autosize={false}
        placeholder='Filtrar Por Rol' // TODO Language
        options={roles}
        onChange={option => this.setSelectedRole(option)}
        value={this.state.selectedRole}
      />
    )
    } else {
      return null
    }
  }

  render () {


    return (
      <div className=''>

        <div>
          <div className='section level has-10-margin-top'>
            <div className='level-left'>
              <div className='level-item'>
                <h1 className='title is-5'>
                  <FormattedMessage
                    id='user.detailTitle'
                    defaultMessage={`Visualiza tus usuarios`}
                  />
                </h1>
              </div>
            </div>
            <div className='level-right'>
              <div className='level-item'>
              <div className='control level-item'>
                {this.slectionRoleComponent()}
              </div>
                <div className='field'>
                  <div className='control has-icons-right'>
                    <input
                      className='input input-search'
                      type='text'
                      value={this.state.searchTerm}
                      onChange={(e) => { this.searchOnChange(e) }}
                      placeholder={this.formatTitle('dashboard.searchText')}
                    />

                    <span className='icon is-small is-right'>
                      <i className='fa fa-search fa-xs' />
                    </span>
                  </div>
                </div>
              </div>
              {testRoles(this.state.canCreate) &&
              <div className='level-item'>
                <a
                  className='button is-info is-pulled-right'
                  onClick={() => this.showModal()}
                >
                  <span>
                    <FormattedMessage
                      id='user.detailBtnNew'
                      defaultMessage={`Nuevo Usuario`}
                    />
                  </span>
                </a>
              </div>
              }
              {testRoles('orgadmin') &&
              <div className='level-item'>
                <a
                  className='button is-info is-pulled-right'
                  onClick={() => this.getUsers()}
                >
                  <span>
                    <FormattedMessage
                      id='user.detailBtnExportUsers'
                      defaultMessage={`Exportar Usuarios`}
                    />
                  </span>
                </a>
              </div>
              }
              {testRoles('orgadmin') &&
              <div className='level-item'>
                <a
                  className='button is-warning is-pulled-right'
                  onClick={() => this.showModalEmail()}
                >
                  <span>
                    <FormattedMessage
                      id='user.sendEmail'
                      defaultMessage={`Enviar Correo`}
                    />
                  </span>
                </a>
              </div>
              }
            </div>
          </div>
          <div className='list-page'>
            <BranchedPaginatedTable
              branchName='users-list'
              apiParams={{
                userRole: (tree.get('user').currentRole.slug || {})
              }}
              baseUrl='/app/users/'
              columns={this.getColumns()}
              filters={{ general: this.state.searchTerm, role: this.state.selectedRole.value }}
            />
          </div>
          <CreateSendEmail
            branchName=''
            url='/app/users/sendEmail'
            className={this.state.modalSendEmail}
            hideModal={() => this.hideModalEmail()}
            finishUp={(obj) => this.finishUpEmail(obj)}
          />
          <CreateUser
            branchName='users-list'
            url='/app/users'
            className={this.state.modalClassName}
            hideModal={() => this.hideModal()}
            finishUp={(obj) => this.finishUp(obj)}
            />
        </div>

        {this.state.userSelected &&
          <div>
            <UserDetail user={this.state.userSelected} selectUser={() => { this.selectUser() }} />
          </div>

        }
      </div>
    )
  }
}

export default injectIntl(UsersDetail)
