import React, { Component } from 'react'

class DashEntManager extends Component {

  moveTo (route) {
    this.props.history.push(route)
  }

  render () {
    return (
      <div className='section container'>

        <h2 className='is-size-4 is-padding-bottom-small has-text-color'>Proyectos</h2>
        <div className='columns is-multiline is-mobile'>
          {this.props.dashboard.projects.map(item => {
            return (
              <div className='column is-3' onClick={() => this.moveTo('/projectsv2/' + item.uuid)} key={item.uuid}>
                <div className='card has-text-centered dash-card'>
                  <header className='card-header'>
                    <p className='card-header-title no-flex is-size-5-touch is-size-4-desktop has-text-white'>
                      <i className='fa fa-file' />
                      {item.name}
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='content'>
                      <p className='is-size-3-touch is-size-1-desktop'>{item.datasets.length || 0}</p>
                      <p className='is-size-6-touch is-size-4-desktop'>Datasets</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
          )
          }

        </div>
      </div>

    )
  }
}

export default DashEntManager
