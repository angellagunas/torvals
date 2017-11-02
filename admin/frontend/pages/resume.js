import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import api from '~base/api'
import moment from 'moment'
import env from '~base/env-variables'
import Resumablejs from 'resumablejs'

import Loader from '~base/components/spinner'
import Multiselect from '~base/components/base-multiselect'
import { BaseTable } from '~base/components/base-table'
import Link from '~base/router/link'

class Resume extends Component {
  constructor (props) {
    super(props)
    this.state = {
      progressBar: 0,
      messageStatus: '',
      fileList: {files: []},
      isPaused: false,
      isUploading: false
    }

    this.resumable = null
  }

  componentDidMount () {
    let ResumableField = new Resumablejs({
      target: env.API_HOST + '/api/upload/',
      // query: this.props.query || {},
      // fileType: this.props.filetypes,
      // maxFiles: this.props.maxFiles,
      // maxFileSize: this.props.maxFileSize,
      fileTypeErrorCallback: (file, errorCount) => {
        this.errorHandler({message: 'File type not supported: ' + file})
      },
      maxFileSizeErrorCallback: (file, errorCount) => {
        this.errorHandler({message: 'File too big: ' + file})
      },
      // testMethod: this.props.testMethod || 'post',
      // testChunks: this.props.testChunks || false,
      headers: this.props.headerObject || {},
      chunkSize: 1024 * 1024,
      // simultaneousUploads: this.props.simultaneousUploads,
      fileParameterName: this.props.fileParameterName || 'file',
      generateUniqueIdentifier: true,
      forceChunkSize: this.props.forceChunkSize || false
    })

    // if (typeof this.props.maxFilesErrorCallback === 'function') {
    //   ResumableField.opts.maxFilesErrorCallback = this.props.maxFilesErrorCallback
    // }

    ResumableField.assignBrowse(this.uploader)

        // Enable or Disable DragAnd Drop
    if (this.props.disableDragAndDrop === false) {
      ResumableField.assignDrop(this.dropZone)
    }

    ResumableField.on('fileAdded', (file, event) => {
      this.setState({
        messageStatus: 'File added! '
      })

      // ResumableField.upload()

      // if (typeof this.props.onFileAdded === 'function') {
      //   this.props.onFileAdded(file, this.resumable)
      // } else {
      //   ResumableField.upload()
      // }
    })

    ResumableField.on('fileSuccess', (file, fileServer) => {
      if (this.props.fileNameServer) {
        let objectServer = JSON.parse(fileServer)
        file.fileName = objectServer[this.props.fileNameServer]
      } else {
        file.fileName = fileServer
      }

      let currentFiles = this.state.fileList.files
      currentFiles.push(file)

      this.setState({
        fileList: {files: currentFiles},
        messageStatus: 'se completó: ' + file.fileName || fileServer
      }, () => {
        if (typeof this.props.onFileSuccess === 'function') {
          this.props.onFileSuccess(file, fileServer)
        }
      })
    })

    ResumableField.on('progress', () => {
      this.setState({
        isUploading: ResumableField.isUploading()
      })

      if ((ResumableField.progress() * 100) < 100) {
        this.setState({
          messageStatus: parseInt(ResumableField.progress() * 100, 10) + '%',
          progressBar: ResumableField.progress() * 100
        })
      } else {
        setTimeout(() => {
          this.setState({
            progressBar: 0
          })
        }, 1000)
      }
    })

    ResumableField.on('fileError', (file, errorCount) => {
      alert('Error')
      // this.props.onUploadErrorCallback(file, errorCount)
    })

    this.resumable = ResumableField
  };

  errorHandler (e) {
    this.setState({
      ...this.state,
      error: e.message,
      apiCallErrorMessage: 'message is-danger'
    })
  }

  uploadButtonOnClick () {
    this.resumable.upload()
  }

  render () {
    // var resetButton
    // if (env.EMAIL_SEND) {
    //   resetButton = (
    //     <div className='columns'>
    //       <div className='column has-text-right'>
    //         <div className='field is-grouped is-grouped-right'>
    //           <div className='control'>
    //             <button
    //               className={this.state.resetClass}
    //               type='button'
    //               onClick={() => this.resetOnClick()}
    //               disabled={!!this.state.resetLoading}
    //               >
    //               {this.state.resetText}
    //             </button>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   )
    // }
    console.log(this.state)

    return (
      <div className='columns c-flex-1 is-marginless'>
        <div className='column is-paddingless'>
          <div className='section'>
            <div className='columns is-mobile'>
              <div className='column'>
                <div className='card'>
                  <header className='card-header'>
                    <p className='card-header-title'>
                      Upload file
                    </p>
                  </header>
                  <div className='card-content'>
                    <div className='columns'>
                      <div className='column'>
                        <div className='file'>
                          <label className='file-label'>
                            <input
                              className='input'
                              id='upload_file_id'
                              ref={node => { this.uploader = node }}
                              type='file'
                              name='upload_file'
                            />
                            <span className='file-cta'>
                              <span className='file-icon'>
                                <i className='fa fa-upload' />
                              </span>
                              <span className='file-label'>
                                Choose a file…
                              </span>
                            </span>
                          </label>
                          <div className='progress' style={{display: this.state.progressBar === 0 ? 'none' : 'block'}}>
                            <div className='progress-bar' style={{width: this.state.progressBar + '%'}} />
                          </div>
                        </div>
                        <button
                          className='button'
                          onClick={e => this.uploadButtonOnClick()}
                        >
                          Upload!
                        </button>
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

Resume.contextTypes = {
  tree: PropTypes.baobab
}

export default branch({}, Resume)
