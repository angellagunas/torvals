import React, { Component } from 'react'

class DashOrgAdmin extends Component {

  moveTo (route) {
    this.props.history.push(route)
  }

  render () {
    return (
      <div className='section container'>
        <h2 className='is-size-4 is-padding-bottom-small has-text-color'>Organización</h2>
        <div className='columns'>

          <div className='column is-3' onClick={() => this.moveTo('/manage/users')}>
            <div className='card has-text-centered dash-card'>
              <header className='card-header'>
                <p className='card-header-title no-flex is-size-5-touch is-size-4-desktop has-text-white'>
                  <i className='fa fa-user' />
                  Usuarios
                </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                  <p className='is-size-3-touch is-size-1-desktop'>{this.props.dashboard.usersCount || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className='column is-3' onClick={() => this.moveTo('/manage/groups')}>
            <div className='card has-text-centered dash-card'>
              <header className='card-header'>
                <p className='card-header-title no-flex is-size-5-touch is-size-4-desktop has-text-white'>
                  <i className='fa fa-users' />
                  Grupos
                </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                  <p className='is-size-3-touch is-size-1-desktop'>{this.props.dashboard.groupsCount || 0}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <h2 className='is-size-4 is-padding-bottom-small has-text-color'>Proyecto</h2>
        <div className='columns'>

          <div className='column is-3' onClick={() => this.moveTo('/datasets')}>
            <div className='card has-text-centered dash-card'>
              <header className='card-header'>
                <p className='card-header-title no-flex is-size-5-touch is-size-4-desktop has-text-white'>
                  <i className='fa fa-file' />
                  Datasets
                </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                  <p className='is-size-3-touch is-size-1-desktop'>{this.props.dashboard.datasetsCount || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className='column is-3' onClick={() => this.moveTo('/forecasts')}>
            <div className='card has-text-centered dash-card'>
              <header className='card-header'>
                <p className='card-header-title no-flex is-size-5-touch is-size-4-desktop has-text-white'>
                  <i className='fa fa-snowflake-o' />
                  Forecasts
                </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                  <p className='is-size-3-touch is-size-1-desktop'>{this.props.dashboard.forecasts.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className='column is-3' onClick={() => this.moveTo('/projectsv2')}>
            <div className='card has-text-centered dash-card'>
              <header className='card-header'>
                <p className='card-header-title no-flex is-size-4 has-text-white'>
                  <i className='fa fa-adjust' />
                  Ajustes
                </p>
              </header>
              <div className='card-content'>
                <div className='content'>
                  <p className='is-size-3-touch is-size-1-desktop'>{this.props.dashboard.adjustCount || 0}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    )
  }
}

export default DashOrgAdmin
