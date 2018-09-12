import React, { Component } from 'react'
import Page from '~base/page'
import Link from '~base/router/link'
import { forcePublic } from '~base/middlewares/'
import LogInButton from './log-in-form'
import Footer from './footer'
import Contact from './contact'
import RegisterModal from './register/registerModal'
import { injectIntl } from 'react-intl'

class HowItWorks extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isDown: false,
      navshadow: '',
      actualComment: 0,
      fade: 'fadeIn',
      menu: '',
      videoModal: '',
      login: '',
      register: ''
    }
    this.handleScroll = this.handleScroll.bind(this)
    this.comments = []
  }

  formatTitle (id) {
    return this.props.intl.formatMessage({ id: id })
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

  showLogin () {
    this.setState({
      login: ' is-active'
    })
  }

  hideLogin () {
    this.setState({
      login: ''
    })
  }

  showReg () {
    this.setState({
      register: ' is-active'
    })
  }

  hideReg () {
    this.setState({
      register: ''
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
                  {this.formatTitle('landing.how')}
                </a>
              </div>
              <div className='navbar-end'>

                <div className={this.state.isDown ? 'navbar-item' : 'is-hidden'}>
                  <a className={this.props.buttonClass ? 'button is-success ' + this.props.buttonClass : 'button is-success'}
                    onClick={(e) => { this.showReg(e) }}>
                    {this.formatTitle('landing.try')}
                  </a>
                </div>

                <div className={!this.state.isDown ? 'navbar-item' : 'is-hidden'}>
                  <a className='button is-primary is-inverted is-outlined'
                    onClick={(e) => { this.showLogin(e) }}>
                    {this.formatTitle('login.loginBtn')}
                  </a>

                </div>

                {!this.state.isDown &&
                  <div className='navbar-item'>
                    <a className='button is-primary is-inverted is-outlined is-capitalized'>
                      {this.formatTitle('dates.locale')}
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
                {this.formatTitle('landing.title3')}
              </h1>
              <div className='columns'>
                <div className='column is-5'>
                  <img className='how__img' src='/app/public/img/dash.jpg' />
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list4')}
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list5')}

                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list6')}

                  </p>
                </div>
                <div className='column is-5 is-offset-1'>
                  <img className='how__img' src='/app/public/img/dash.jpg' />
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list7')}

                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list8')}

                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list9')}
                  </p>
                </div>
              </div>

              <br />
              {/* <div className='columns is-centered'>
                <div className='column is-8 has-text-centered how__video'>
                Mira el video de introducción y conoce más de Orax.
                <a onClick={() => { this.showVideoModal() }} >

                  <span className='icon is-medium'>
                    <i className='fa fa-lg fa-play-circle' />
                  </span>
                      Ver ahora

                </a>
                </div>
              </div> */}

              <div className='columns'>
                <div className='column is-5'>
                  <img className='how__img' src='/app/public/img/dash.jpg' />
                </div>
                <div className='column is-5 is-offset-1'>
                  <h1 className='title'>
                    {this.formatTitle('landing.title4')}
                  </h1>
                  <h2 className='subtitle'>
                  &nbsp;
                  </h2>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list10')}

                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list11')}

                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list12')}

                  </p>
                </div>
              </div>

              <div className='columns'>
                <div className='column is-5'>
                  <h1 className='title'>
                    {this.formatTitle('landing.title5')}

                  </h1>
                  <h2 className='subtitle'>
                    &nbsp;
                  </h2>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list13')}

                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list14')}

                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list15')}

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
                    {this.formatTitle('landing.title6')}

                  </h1>
                  <h2 className='subtitle'>
                    {this.formatTitle('landing.sub3')}
                  </h2>
                </div>

                <div className='column has-text-centered'>
                  <RegisterModal buttonClass='is-medium' />
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

        <LogInButton
          modalClass={this.state.login}
          showModal={() => this.showLogin()}
          hideModal={() => this.hideLogin()} />

        <RegisterModal
          modalClass={this.state.register}
          showModal={() => this.showReg()}
          hideModal={() => this.hideReg()} />
      </div>
    )
  }
}

export default Page({
  path: '/how',
  exact: true,
  validate: forcePublic,
  component: injectIntl(HowItWorks)
})
