import React, { Component } from 'react'
import api from '~base/api'
import { withRouter } from 'react-router'

class OrgUsers extends Component {
  constructor (props) {
    super(props)
    this.state = {
      org: this.props.org,
      regUsers: 0
    }
  }

  async getUsers () {
    let url = '/app/users'
    try {
      let res = await api.get(url)

      if (res.total) {
        this.setState({
          regUsers: res.total
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  componentWillMount () {
    this.getUsers()
  }

  render () {
    return (
      <div className='columns'>
        <div className='column is-narrow has-20-margin-sides'>
          <div className='organization-daysleft'>
            <h2>Tienes disponibles</h2>
            <h1>{this.state.org.availableUsers} usuarios</h1>
            <p>
              Permitidos para tu cuenta
            </p>
          </div>
        </div>
        <div className='column is-narrow pos-rel'>
          <div className='divider' />
        </div>

        <div className='column is-narrow has-20-margin-sides'>
          <div className='organization-daysleft'>
            <h2>Tienes registrados</h2>
            <h1 className='has-text-success'>{this.state.regUsers} usuarios</h1>
            <p>
              Permitidos para tu cuenta
            </p>
          </div>
        </div>

        <button className='button is-primary is-medium has-30-margin-top has-20-margin-sides'
          onClick={() => this.props.history.push('/manage/users-groups')} >
            Ver usuarios
        </button>
      </div>
    )
  }
}

export default withRouter(OrgUsers)
