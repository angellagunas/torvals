import React, { Component } from 'react'

class Breadcrumb extends Component {
  constructor (props) {
    super(props)
    this.bindFunctions()
    this.state = {
      pathConfiguration: this.buildPath(props)
    }
  }

  componentWillReceiveProps (nextProps) {
    this.setState({
      pathConfiguration: this.buildPath(nextProps)
    })
  }

  bindFunctions () {
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick (path) {
    return (e) => {
      this.props.onClick(e, path)
    }
  }

  buildPath (props) {
    if (typeof props.path === 'string') {
      return this.buildPathForString(props)
    }
    return this.buildPathForArray(props)
  }

  buildPathForString (props) {
    const pathConfiguration = {
      breadcrumbPath: []
    }

    const pathSections = props.path.split('/')
    let accumulatePath = ''
    for (const path of pathSections) {
      if (path && path !== '') {
        accumulatePath += `/${path}`
        pathConfiguration.breadcrumbPath.push({
          label: path,
          path: accumulatePath
        })
      }
    }
    return pathConfiguration
  }

  buildPathForArray (props) {
    return {
      breadcrumbPath: props.path
    }
  }

  getPathComponents () {
    const { pathConfiguration } = this.state
    return pathConfiguration.breadcrumbPath.map(
      (path, index) => (this.getPathComponent(path, pathConfiguration.separatorChar, index))
    )
  }

  getPathComponent (pathObj, separatorChar, index) {
    return (
      <li className={pathObj.current ? 'is-active' : ''}>
        {this.getLinkPath(pathObj)}
      </li>
    )
  }

  getLinkPath (pathObj) {
    if (pathObj.path && pathObj.path !== '') {
      return (
        <a href={pathObj.path} aria-current={pathObj.current ? 'page' : ''}>
          {pathObj.label}
        </a>
      )
    }
    return pathObj.label
  }

  render () {
    const { align } = this.props
    var aligmentBreadcrumbs = ''

    if (align === 'right') {
      aligmentBreadcrumbs = 'is-right'
    } else if (align === 'centered') {
      aligmentBreadcrumbs = 'is-centered'
    }

    return (
      <div>
        <nav className={'breadcrumb has-succeeds-separator ' + aligmentBreadcrumbs} aria-label='breadcrumbs'>
          <ul>
            {this.getPathComponents()}
          </ul>
        </nav>
      </div>
    )
  }
}

export default Breadcrumb
