import React, { Component } from 'react'
import Page from '~base/page'
import Link from '~base/router/link'
import { forcePublic } from '~base/middlewares/'
import LogInButton from './log-in-form'
import Footer from './footer'
import Contact from './contact'
import RegisterModal from './register/registerModal'

class LandPage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isDown: false,
      navshadow: '',
      actualComment: 0,
      fade: 'fadeIn',
      menu: ''
    }
    this.handleScroll = this.handleScroll.bind(this)
    this.comments = []
  }

  componentDidMount () {
    window.addEventListener('scroll', this.handleScroll, false)
    this.banner()
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this.handleScroll, false)
    clearInterval(this.interval)
  }

  banner () {
    this.interval = setInterval(() => {
      let actual = this.state.actualComment + 1
      if (actual >= this.comments.length) {
        actual = 0
      }
      this.setState({
        fade: 'fadeOut'
      }, () => {
        setTimeout(() => {
          this.setState({
            fade: 'fadeIn',
            actualComment: actual
          })
        }, 300)
      })
    }, 5000)
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

  getComments () {
    this.comments = [
      <div className={'has-text-centered comments__item ' + this.state.fade}>
        <p>
          <img src='/app/public/img/woman.png' />
        </p>
        <h1 className='title is-size-4'>
          “That’s been one of my mantras — focus and simplicity.
           Simple can be harder than complex;
          you have to work hard to get your thinking clean to make it simple.”
                </h1>
        <p className='is-size-5'>STEVE JOBS - APPLE 1</p>
      </div>,
      <div className={'has-text-centered comments__item ' + this.state.fade}>
        <p>
          <img src='/app/public/img/woman.png' />
        </p>
        <h1 className='title is-size-4'>
          “That’s been one of my mantras — focus and simplicity.
           Simple can be harder than complex;
          you have to work hard to get your thinking clean to make it simple.”
                </h1>
        <p className='is-size-5'>STEVE JOBS - APPLE 2</p>
      </div>,
      <div className={'has-text-centered comments__item ' + this.state.fade}>
        <p>
          <img src='/app/public/img/woman.png' />
        </p>
        <h1 className='title is-size-4'>
          “That’s been one of my mantras — focus and simplicity.
           Simple can be harder than complex;
          you have to work hard to get your thinking clean to make it simple.”
                </h1>
        <p className='is-size-5'>STEVE JOBS - APPLE 3</p>
      </div>
    ]
    return (
      this.comments[this.state.actualComment]
    )
  }

  toggleMenu () {
    this.setState({
      menu: this.state.menu === '' ? ' is-active' : ''
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
                <a className='navbar-item' onClick={() => { this.props.history.push('/how') }} >
                  ¿Cómo funciona?
                </a>
              </div>
              <div className='navbar-end'>

                {this.state.isDown
                  ? <div className='navbar-item'>
                    <RegisterModal />
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
        <section className='hero is-medium is-primary changeBack' id='header'>
          <div className='hero-body'>
            <div className='container'>
              <div className='columns'>
                <div className='column pos-rel'>
                  <h1 className='title'>
                    Decisiones inteligentes
                  </h1>
                  <h2 className='subtitle'>
                    A partir de predicciones
                  </h2>
                  <RegisterModal buttonClass='is-medium' />
                  <img className='landing-right-img is-hidden-mobile' src='/app/public/img/dash.jpg' />

                </div>
              </div>

            </div>
          </div>
        </section>

        <section className='hero is-medium is-bg-whitesmoke'>
          <div className='hero-body'>
            <div className='container'>
              <div className='columns'>
                <div className='column is-6'>
                  <h1 className='title'>
                    ¿Qué es Orax?
                  </h1>
                  <h2 className='subtitle'>
                    Orax es una herramienta moderna que con base en información histórica,
                    predice la demanda para guiarnos a través de la incertidumbre, ayudándonos
                    a tomar mejores decisiones empresariales y a responder de maner más ágil.
                  </h2>
                </div>
                <div className='column'>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Manejo de información en tiempo real.
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Predicción confiable de ventas o producción.
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    Ajustes entre predicciones, existencias o pedidos.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section className='hero is-medium is-primary changeBack'>
          <div className='hero-body'>
            <div className='container has-text-centered comments'>
              {this.getComments()}
            </div>
          </div>
        </section>

        <Contact />

        <Footer />
      </div>
    )
  }
              }

export default Page({
  path: '/landing',
  exact: true,
  validate: forcePublic,
  component: LandPage
})
