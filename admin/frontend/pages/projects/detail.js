import React, { Component } from 'react'
import api from '~base/api'

import Loader from '~base/components/spinner'
import ProjectForm from './create-form'
import AddDataset from './add-dataset'
import { BranchedPaginatedTable } from '~base/components/base-paginatedTable'

class ProjectDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      loaded: false,
      project: {},
      className: ''
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
    await api.del(url)
    this.props.history.push('/admin/projects')
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

  finishUp (object) {
    this.setState({
      className: ''
    })
    this.props.history.push('/admin/manage/roles/' + object.uuid)
  }

  render () {
    const { project } = this.state

    if (!this.state.loaded) {
      return <Loader />
    }

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns'>
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
                          initialState={{...project, organization: project.organization.uuid}}
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
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Datasets
                    </p>
                    <div className='card-header-select'>
                      <button className='button is-primary' onClick={() => this.showModal()}>
                        Add Dataset
                      </button>
                      <AddDataset
                        className={this.state.className}
                        hideModal={this.hideModal.bind(this)}
                        finishUp={this.finishUp.bind(this)}
                        branchName='roles'
                        baseUrl='/admin/roles'
                        url='/admin/roles'
                        project={project}
                      />
                    </div>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column' />
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
