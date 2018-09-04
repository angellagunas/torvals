import React, { Component } from 'react'
import Page from '~base/page'
import Link from '~base/router/link'
import { forcePublic } from '~base/middlewares/'
import LogInButton from './log-in-form'
import Footer from './footer'
import Contact from './contact'
import RegisterModal from './register/registerModal'
import { injectIntl } from 'react-intl'

class LandPage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isDown: false,
      navshadow: '',
      actualComment: 0,
      fade: 'fadeIn',
      menu: '',
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
                <a className='navbar-item' onClick={() => { this.props.history.push('/how') }} >
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
        <section className='hero is-medium is-primary changeBack' id='header'>
          <div className='hero-body'>
            <div className='container'>
              <div className='columns'>
                <div className='column pos-rel'>
                  <h1 className='title'>
                    {this.formatTitle('landing.title1')}
                  </h1>
                  <h2 className='subtitle'>
                    {this.formatTitle('landing.sub1')}
                  </h2>
                  <a className='button is-success is-medium'
                    onClick={(e) => { this.showReg(e) }}>
                    {this.formatTitle('landing.try')}
                  </a>
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
                  <h1 className='title is-spaced'>
                    {this.formatTitle('landing.title2')}
                  </h1>
                  <h2 className='subtitle'>
                    {this.formatTitle('landing.sub2')}
                  </h2>
                </div>
                <div className='column is-offset-1'>
                  <h1 className='title'>
                    &nbsp;
                  </h1>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list1')}
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list2')}
                  </p>
                  <p>
                    <span className='icon has-text-success'>
                      <i className='fa fa-check' />
                    </span>
                    {this.formatTitle('landing.list3')}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* <section className='hero is-medium is-primary changeBack'>
          <div className='hero-body'>
            <div className='container has-text-centered comments'>
              {this.getComments()}
            </div>
          </div>
        </section> */}

        <Contact />

        <Footer />

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
  path: '/landing',
  exact: true,
  validate: forcePublic,
  component: injectIntl(LandPage)
})
