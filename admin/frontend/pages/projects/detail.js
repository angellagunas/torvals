import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import Link from '~base/router/link'
import api from '~base/api'

import Loader from '~base/components/spinner'
import ProjectForm from './create-form'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'

class ProjectDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      project: {}
    }
  }

  componentWillMount () {
    this.load()
  }

  async load () {
    var url = '/admin/projects/' + this.props.match.params.uuid
    const body = await api.get(url)

    this.setState({
      loading: false,
      loaded: true,
      project: body.data
    })
  }

  async deleteOnClick () {
    var url = '/admin/projects/' + this.props.match.params.uuid
    const body = await api.del(url)
    this.props.history.push('/admin/projects')
  }

  getDeleteButton () {
    return (
      <div className='column has-text-right'>
        <div className='field is-grouped is-grouped-right'>
          <div className='control'>
            <button
              className='button is-danger'
              type='button'
              onClick={() => this.deleteOnClick()}
                >
                  Delete
                </button>
          </div>
        </div>
      </div>
    )

    return null
  }

  render () {
    const { project } = this.state.project

    if (!this.state.loaded) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns'>
              {this.getDeleteButton()}
            </div>
            <div className='columns'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Project
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <ProjectForm
                          baseUrl='/admin/projects'
                          url={'/admin/projects/' + this.props.match.params.uuid}
                          initialState={this.state.project}
                          load={this.load.bind(this)}
                        >
                          <div className='field is-grouped'>
                            <div className='control'>
                              <button className='button is-primary'>Save</button>
                            </div>
                          </div>
                        </ProjectForm>
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

export default ProjectDetail
