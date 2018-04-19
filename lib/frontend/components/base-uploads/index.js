import React, { Component } from 'react'
import Resumablejs from 'resumablejs'
import shortid from 'shortid'
import numeral from 'numeraljs'
import FontAwesome from 'react-fontawesome'
import { Prompt } from 'react-router-dom'
import tree from '~core/tree'
import PropTypes from 'prop-types'

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
      target: this.props.url,
      maxFiles: '1',
      fileTypeErrorCallback: (file, errorCount) => {
        this.errorHandler({message: 'Tipo de archivo no soportado: ' + file})
      },
      maxFileSizeErrorCallback: (file, errorCount) => {
        this.errorHandler({message: 'El archivo excede el tamaño máximo: ' + file})
      },
      maxFilesErrorCallback: () => {
        this.errorHandler({message: 'Sólo puedes agregar un archivo!'})
      },
      testMethod: this.props.testMethod || 'get',
      query: this.props.query || {},
      testChunks: this.props.testChunks || true,
      headers: this.props.headerObject || {Authorization: `Bearer ${tree.get('jwt')}`},
      chunkSize: 1024 * 1024,
      maxChunkRetries: 30,
      chunkRetryInterval: 200,
      fileParameterName: this.props.fileParameterName || 'file',
      generateUniqueIdentifier: true,
      forceChunkSize: this.props.forceChunkSize || false,
      fileType: ['csv']
    })

    ResumableField.assignBrowse(this.uploader)

    ResumableField.assignDrop(document.getElementById('upload_file_dropzone'))

    ResumableField.on('fileAdded', (file, event) => {
      let currentFiles = this.state.fileList

      currentFiles.push(file)

      this.setState({
        fileList: currentFiles,
        messageInfo: 'Tu archivo está listo para subirse',
        apiCallMessage: 'has-text-success',
        apiCallErrorMessage: 'is-hidden'
      })

      setTimeout(() => {
        this.setState({
          apiCallMessage: 'is-hidden'
        })
      }, 5000)
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
        messageInfo: 'Carga completa: ' + file.file.name,
        apiCallMessage: 'has-text-success',
        apiCallErrorMessage: 'is-hidden',
        hasFinished: hasFinished
      })

      setTimeout(() => {
        this.setState({
          apiCallMessage: 'is-hidden'
        })
        this.props.load()
      }, 5000)
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
        message: (
          'Se encontró un error al subir el archivo ' + file.file.name +
          '!. Carga cancelada.'
        )
      })

      let currentFileList = this.state.fileList
      this.resumable.removeFile(currentFileList[0])

      this.setState({
        fileList: []
      })
    })

    this.resumable = ResumableField
  }

  componentWillUnmount () {
    this.resumable.cancel()
  }

  errorHandler (e) {
    this.setState({
      ...this.state,
      error: e.message,
      apiCallErrorMessage: 'has-text-danger'
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
      isUploading,
      fileList
    } = this.state

    if (isUploading || hasFinished || fileList.length === 0) {
      return null
    }

    return (
      <p className='control'>
        <button
          className='button is-success'
          onClick={e => this.startUpload()}
          disabled={fileList.length === 0}
        >
          Subir
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
          className='button is-info'
          onClick={e => this.removeFile(e, fileList[0], 0)}
        >
          Cambiar archivo
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
        <Prompt
          when={isUploading}
          message={location => (
            `Se está subiendo un archivo, ¿estás seguro de querer salir de esta página?`
          )}
        />
        <header className='card-header'>
          <p className='card-header-title'>
            Subir archivo
          </p>
        </header>
        <div
          className='card-content'
          id='upload_file_dropzone'
        >
          <div className='columns is-centered'>
            <div className='column is-8 is-narrow has-text-centered'>
              <div
                className={fileList.length === 1 ? 'file is-boxed is-centered is-large is-hidden is-info' : 'file is-boxed is-centered is-large is-info'}
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
                      <i className='fa fa-cloud-upload' />
                    </span>
                    <span className='file-label'>
                      Arrastra tu archivo aquí o busca un documento en tu equipo para cargarlo.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className='columns is-centered'>
            <div className='column is-8 is-narrow'>
              {fileListList}
            </div>
          </div>
          <div className={progressBar === 0 ? 'is-hidden columns' : 'columns is-centered'}>
            <div className='column has-text-centered is-6 is-narrow'>
              <p>
                <span className={progressBar < 90 ? 'has-text-info' : 'has-text-success'}>
                  {numeral(progressBar).format('0') + '%'}
                </span>
                <br />
                <progress
                  className={progressBar < 90 ? 'progress is-small is-info' : 'progress is-small is-success'}
                  style={{display: progressBar === 0 ? 'none' : 'block'}}
                  value={progressBar}
                  max='100'
                  >
                  {progressBar + '%'}
                </progress>

                <span className={progressBar < 90 ? 'has-text-info' : 'has-text-success'}>
                  Cargando archivo...
                </span>
              </p>
            </div>
          </div>
          <div className={apiCallMessage}>
            <div className='is-size-7 has-text-centered'>
              {messageInfo}
            </div>
          </div>

          <div className={apiCallErrorMessage}>
            <div className='is-size-7 has-text-centered'>
              {error}
            </div>
          </div>
          <div className={hasFinished || isUploading ? 'is-hidden' : 'field is-grouped'}>
            {this.getRemoveFileButton()}
            {this.getUploadButton()}
          </div>
        </div>
      </div>
    )
  }
}

UploadDataset.proptypes = {
  url: PropTypes.string.isRequired
}

export { UploadDataset }
