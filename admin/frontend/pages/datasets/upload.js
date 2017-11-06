import React, { Component } from 'react'
import env from '~base/env-variables'
import Resumablejs from 'resumablejs'
import shortid from 'shortid'
import numeral from 'numeraljs'
import FontAwesome from 'react-fontawesome'

class UploadDataset extends Component {
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
      messageInfo: '',
      hasFinished: false
    }

    this.resumable = null
    this.uploaderID = 'upload_file_id'
  }

  componentDidMount () {
    let ResumableField = new Resumablejs({
      target: env.API_HOST + '/api/upload/',
      maxFiles: '1',
      fileTypeErrorCallback: (file, errorCount) => {
        this.errorHandler({message: 'File type not supported: ' + file})
      },
      maxFileSizeErrorCallback: (file, errorCount) => {
        this.errorHandler({message: 'File too big: ' + file})
      },
      maxFilesErrorCallback: () => {
        this.errorHandler({message: 'You can only upload one file!'})
      },
      testMethod: this.props.testMethod || 'get',
      query: this.props.query || {},
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
    // ResumableField.assignDrop(this.dropZone)

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

      let hasFinished = true
      for (var fi of this.state.fileList) {
        if (!fi.isDone) {
          hasFinished = false
          break
        }
      }

      this.setState({
        messageInfo: 'Upload completed: ' + file.file.name,
        apiCallMessage: 'message is-success',
        apiCallErrorMessage: 'is-hidden',
        hasFinished: hasFinished
      })

      setTimeout(() => {
        this.setState({
          apiCallMessage: 'is-hidden'
        })
        this.props.load()
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
    currentFileList.splice(index, 1)

    this.setState({
      fileList: currentFileList
    })

    this.resumable.removeFile(file)
  }

  startUpload () {
    this.setState({
      apiCallErrorMessage: 'is-hidden'
    })
    this.resumable.upload()
    this.props.load()
  }

  createFileList () {
    let markup = this.state.fileList.map((file, index) => {
      let fileSize = numeral(file.size / 1000000).format('0,0.0')
      let uniqID = shortid.generate()
      let originFile = file.file
      let media = ''

      media = <label className='document'>{originFile.name}</label>
      let icon = null

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

  getUploadButton () {
    let {
      hasFinished,
      isUploading
    } = this.state

    if (isUploading || hasFinished) {
      return null
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

  getRemoveFileButton () {
    let {
      fileList,
      hasFinished,
      isUploading
    } = this.state

    if (isUploading || fileList.length === 0 || hasFinished) {
      return null
    }

    return (
      <p className='control'>
        <button
          className='button is-warning'
          onClick={e => this.removeFile(e, fileList[0], 0)}
        >
          Change file
        </button>
      </p>
    )
  }

  render () {
    let fileListList = null
    fileListList = <div className='resumable-list'>{this.createFileList()}</div>

    let {
      progressBar,
      isUploading,
      hasFinished,
      apiCallMessage,
      apiCallErrorMessage,
      fileList,
      messageInfo,
      error
    } = this.state

    return (
      <div className='card'>
        <header className='card-header'>
          <p className='card-header-title'>
            Upload file
          </p>
        </header>
        <div
          className='card-content'
          id='upload_file_dropzone'
        >
          <div className='columns'>
            <div className='column'>
              <div
                className={fileList.length === 1 ? 'file has_name is-hidden' : 'file has_name'}
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
              {fileListList}
            </div>
          </div>
          <div className={progressBar === 0 ? 'is-hidden columns' : 'columns'}>
            <div className='column'>
              <p>
                <progress
                  className='progress is-primary'
                  style={{display: progressBar === 0 ? 'none' : 'block'}}
                  value={progressBar}
                  max='100'
                  >
                  {progressBar + '%'}
                </progress>
                {numeral(progressBar).format('0') + '%'}
              </p>
            </div>
          </div>
          <div className={apiCallMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              {messageInfo}
            </div>
          </div>

          <div className={apiCallErrorMessage}>
            <div className='message-body is-size-7 has-text-centered'>
              {error}
            </div>
          </div>
        </div>
        <footer
          className={hasFinished || isUploading ? 'card-footer is-hidden' : 'card-footer'}
        >
          <div className='field is-grouped'>
            {this.getUploadButton()}
            {this.getRemoveFileButton()}
          </div>
        </footer>
      </div>
    )
  }
}

export default UploadDataset
