import React, { Component } from 'react'
import { branch } from 'baobab-react/higher-order'
import PropTypes from 'baobab-react/prop-types'
import env from '~base/env-variables'
import Resumablejs from 'resumablejs'
import shortid from 'shortid'
import numeral from 'numeraljs'
import FontAwesome from 'react-fontawesome'

class Resume extends Component {
  constructor (props) {
    super(props)
    this.state = {
      progressBar: 0,
      messageStatus: '',
      fileList: [],
      isPaused: false,
      isUploading: false,
      apiCallMessage: 'is-hidden',
      apiCallErrorMessage: 'is-hidden',
      messageInfo: ''
    }

    this.resumable = null
    this.uploaderID = 'upload_file_id'
  }

  componentDidMount () {
    let ResumableField = new Resumablejs({
      target: env.API_HOST + '/api/upload/',
      fileTypeErrorCallback: (file, errorCount) => {
        this.errorHandler({message: 'File type not supported: ' + file})
      },
      maxFileSizeErrorCallback: (file, errorCount) => {
        this.errorHandler({message: 'File too big: ' + file})
      },
      testMethod: this.props.testMethod || 'get',
      testChunks: this.props.testChunks || true,
      headers: this.props.headerObject || {},
      chunkSize: 1024 * 1024,
      maxChunkRetries: 30,
      chunkRetryInterval: 200,
      fileParameterName: this.props.fileParameterName || 'file',
      generateUniqueIdentifier: true,
      forceChunkSize: this.props.forceChunkSize || false
    })

    ResumableField.assignBrowse(this.uploader)
    ResumableField.assignDrop(this.dropZone)

    ResumableField.on('fileAdded', (file, event) => {
      let currentFiles = this.state.fileList
      currentFiles.push(file)

      this.setState({
        fileList: currentFiles,
        messageInfo: 'File added!',
        apiCallMessage: 'message is-success',
        apiCallErrorMessage: 'is-hidden'
      })

      setTimeout(() => {
        this.setState({
          apiCallMessage: 'is-hidden'
        })
      }, 2000)
    })

    ResumableField.on('fileSuccess', (file, fileServer) => {
      file.isDone = true

      this.setState({
        messageInfo: 'Upload completed: ' + file.file.name,
        apiCallMessage: 'message is-success',
        apiCallErrorMessage: 'is-hidden'
      })

      setTimeout(() => {
        this.setState({
          apiCallMessage: 'is-hidden'
        })
      }, 2000)
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
      this.errorHandler({
        message: 'Encountered an error uploading file ' + file.file.name + '!. Upload cancelled'
      })
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

  removeFile (event, file, index) {
    event.preventDefault()

    let currentFileList = this.state.fileList
    delete currentFileList[index]

    this.setState({
      fileList: currentFileList
    })

    this.resumable.removeFile(file)
  }

  cancelUpload () {
    this.resumable.cancel()

    this.setState({
      fileList: [],
      isPaused: false,
      isUploading: false,
      apiCallErrorMessage: 'is-hidden'
    })
  }

  pauseUpload () {
    if (!this.state.isPaused) {
      this.resumable.pause()
      this.setState({
        isPaused: true,
        apiCallErrorMessage: 'is-hidden'
      })
    } else {
      this.resumable.upload()
      this.setState({
        isPaused: false,
        apiCallErrorMessage: 'is-hidden'
      })
    }
  }

  startUpload () {
    this.setState({
      apiCallErrorMessage: 'is-hidden'
    })
    this.resumable.upload()
  }

  createFileList () {
    let markup = this.state.fileList.map((file, index) => {
      let fileSize = numeral(file.size / 1000000).format('0,0.0')
      let uniqID = shortid.generate()
      let originFile = file.file
      let media = ''

      media = <label className='document'>{originFile.name}</label>
      let icon = (
        <a
          onClick={(event) => this.removeFile(event, file, index)}
          href='#'
        >
          <span className='icon has-text-danger'>
            <FontAwesome name='close' />
          </span>
        </a>
      )

      if (file.isDone) {
        icon = (
          <span className='icon has-text-success'>
            <FontAwesome name='check' />
          </span>
        )
      }

      return (
        <li className='thumbnail' key={uniqID}>
          <label id={'media_' + uniqID}>{media} ({fileSize} MB)</label>
          {icon}
        </li>
      )
    })

    return <ul id={'items-' + this.uploaderID}>{markup}</ul>
  }

  getPauseUploadButton () {
    if (this.state.isUploading) {
      return (
        <p className='control'>
          <button
            className='button is-warning'
            onClick={e => this.pauseUpload()}
          >
            Pause
          </button>
        </p>
      )
    }
  }

  getResumeUploadButton () {
    if (this.state.isPaused) {
      return (
        <p className='control'>
          <button
            className='button is-success'
            onClick={e => this.pauseUpload()}
          >
            Resume
          </button>
        </p>
      )
    }
  }

  getCancelUploadButton () {
    if (this.state.isPaused) {
      return (
        <p className='control'>
          <button
            className='button is-danger'
            onClick={e => this.cancelUpload()}
          >
            Cancel Upload
          </button>
        </p>
      )
    }
  }

  getUploadButton () {
    if (this.state.isUploading) {
      return (
        <p className='control'>
          <button
            className='button is-primary is-loading'
            onClick={e => this.startUpload()}
            disabled
          >
            Uploading....
          </button>
        </p>
      )
    }

    return (
      <p className='control'>
        <button
          className='button is-primary'
          onClick={e => this.startUpload()}
        >
          Start Upload
        </button>
      </p>
    )
  }

  render () {
    let fileList = null
    fileList = <div className='resumable-list'>{this.createFileList()}</div>

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
                  <div
                    className='card-content'
                    ref={node => this.dropZone = node}
                    id='upload_file_dropzone'
                  >
                    <div className='columns'>
                      <div className='column'>
                        <div
                          className='file has_name'
                        >
                          <label className='file-label'>
                            <input
                              className='file-input'
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
                        </div>
                      </div>
                    </div>
                    <div className='columns'>
                      <div className='column'>
                        {fileList}
                      </div>
                    </div>
                    <div className={this.state.progressBar === 0 ? 'is-hidden columns' : 'columns'}>
                      <div className='column'>
                        <p>
                          <progress
                            className='progress is-primary'
                            style={{display: this.state.progressBar === 0 ? 'none' : 'block'}}
                            value={this.state.progressBar}
                            max='100'
                            >
                            {this.state.progressBar + '%'}
                          </progress>
                          {numeral(this.state.progressBar).format('0') + '%'}
                        </p>
                      </div>
                    </div>
                    <div className={this.state.apiCallMessage}>
                      <div className='message-body is-size-7 has-text-centered'>
                        {this.state.messageInfo}
                      </div>
                    </div>

                    <div className={this.state.apiCallErrorMessage}>
                      <div className='message-body is-size-7 has-text-centered'>
                        {this.state.error}
                      </div>
                    </div>
                  </div>
                  <footer className='card-footer'>
                    <div className='field is-grouped'>
                      {this.getUploadButton()}
                      {this.getPauseUploadButton()}
                      {this.getResumeUploadButton()}
                      {this.getCancelUploadButton()}
                    </div>
                  </footer>
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
