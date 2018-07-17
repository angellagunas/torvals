import React, { Component } from 'react'
import Page from '~base/page'
import Link from '~base/router/link'
import { forcePublic } from '~base/middlewares/'
import LogInButton from './log-in-form'
import Footer from './footer'
import Contact from './contact'

class HowItWorks extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isDown: false,
      navshadow: '',
      actualComment: 0,
      fade: 'fadeIn',
      menu: '',
      videoModal: ''
    }
    this.handleScroll = this.handleScroll.bind(this)
    this.comments = []
  }

  componentDidMount () {
    window.addEventListener('scroll', this.handleScroll, false)
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this.handleScroll, false)
  }

  handleScroll (e) {
    let supportPageOffset = window.pageXOffset !== undefined
    let isCSS1Compat = ((document.compatMode || '') === 'CSS1Compat')
    let scroll = {
      x: supportPageOffset ? window.pageXOffset : isCSS1Compat ? document.documentElement.scrollLeft : document.body.scrollLeft,
      y: supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop
    }

    if (scroll.y === 0 && this.state.navshadow) {
      this.setState({
        navshadow: ''
      })
    } else if (scroll.y > 0 && !this.state.navshadow) {
      this.setState({
        navshadow: ' has-shadow'
      })
    }

    if (scroll.y > 350 && !this.state.isDown) {
      this.setState({
        isDown: true
      })
    } else if (scroll.y < 350 && this.state.isDown) {
      this.setState({
        isDown: false
      })
    }
  }

  toggleMenu () {
    this.setState({
      menu: this.state.menu === '' ? ' is-active' : ''
    })
  }

  showVideoModal () {
    this.setState({
      videoModal: ' is-active'
    })
  }

  hideVideoModal () {
    this.setState({
      videoModal: ''
    })
  }

  render () {
    return (
      <div className='landing'>
        <nav className={'navbar is-primary is-fixed-top changeBack' + this.state.navshadow}>
          <div className='container'>
            <div className='navbar-brand'>
              <Link to='/landing' className='navbar-item'>
                <img src='/app/public/img/logow.png' width='112px' />
              </Link>
              <a role='button' className={'navbar-burger' + this.state.menu}
                aria-label='menu'
                aria-expanded='false'
                onClick={() => { this.toggleMenu() }} >
                <span aria-hidden='true' />
                <span aria-hidden='true' />
                <span aria-hidden='true' />
              </a>
            </div>
            <div className={'navbar-menu' + this.state.menu}>
              <div className='navbar-start'>
                <a className='navbar-item'>
                  ¿Cómo funciona?
                </a>
              </div>
              <div className='navbar-end'>

                {this.state.isDown
                  ? <div className='navbar-item'>
                    <button className='button is-success'>
                      Probar 30 días gratis
                    </button>
                  </div>

                  : <div className='navbar-item'>
                    <LogInButton />
                  </div>
                }

                {!this.state.isDown &&
                  <div className='navbar-item'>
                    <a className='button is-primary is-inverted is-outlined'>
                      ES
                    </a>
                  </div>

                }

              </div>
            </div>
          </div>
        </nav>
        <section className='hero is-medium changeBack__gradient' id='header'>
          <div className='hero-body'>
            <div className='container'>
              <h1 className='title has-text-white'>
                Large title
              </h1>
              <div className='columns'>
                <div className='column is-5'>
                  <img className='how__img' src='/app/public/img/dash.jpg' />
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                </div>
                <div className='column is-5 is-offset-1'>
                  <img className='how__img' src='/app/public/img/dash.jpg' />
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                </div>
              </div>

              <div className='columns is-centered'>
                <div className='column is-8 has-text-centered how__video'>
                Mira el video de introducción y conoce más de Orax.
                <a onClick={() => { this.showVideoModal() }} >

                  <span className='icon is-medium'>
                    <i className='fa fa-lg fa-play-circle' />
                  </span>
                      Ver ahora

                </a>
                </div>
              </div>

              <div className='columns'>
                <div className='column is-5'>
                  <img className='how__img' src='/app/public/img/dash.jpg' />
                </div>
                <div className='column is-5 is-offset-1'>
                  <h1 className='title'>
                    Large title
                  </h1>
                  <h2 className='subtitle'>
                    Large subtitle
                  </h2>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                </div>
              </div>

              <div className='columns'>
                <div className='column is-5'>
                  <h1 className='title'>
                    Large title
                  </h1>
                  <h2 className='subtitle'>
                    Large subtitle
                  </h2>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Item list
                  </p>
                </div>

                <div className='column is-5 is-offset-1'>
                  <img className='how__img' src='/app/public/img/dash.jpg' />
                </div>
              </div>

            </div>
          </div>
        </section>

        <section className='hero is-medium is-primary changeBack'>
          <div className='hero-body'>
            <div className='container'>
              <div className='columns'>
                <div className='column'>
                  <h1 className='title'>
                    Large title
                  </h1>
                  <h2 className='subtitle'>
                    Large subtitle
                  </h2>
                </div>

                <div className='column has-text-centered'>
                  <button className='button is-success is-medium'>
                    Probar 30 días gratis
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        <Contact />

        <Footer />

        <div className={'modal video' + this.state.videoModal}>
          <div className='modal-background' onClick={() => { this.hideVideoModal() }} />
          <div className='modal-content'>
            <iframe width='560' height='315'
              src='https://www.youtube-nocookie.com/embed/xcJtL7QggTI?rel=0'
              frameBorder='0'
              allow='autoplay; encrypted-media'
              allowFullScreen />
          </div>
          <button className='modal-close is-large' aria-label='close' onClick={() => { this.hideVideoModal() }} />
        </div>

      </div>
    )
  }
}

export default Page({
  path: '/how',
  exact: true,
  validate: forcePublic,
  component: HowItWorks
})
