import React, { Fragment } from 'react'
import Link from '~base/router/link'
import { FormattedMessage } from 'react-intl'

export function EmptyMessage({ text, btnText, to = '/projects', title ='dashboard.msgTitle' }) {
  return (
    <article className="message is-info">
      <div className="message-header">
        <p>
          <FormattedMessage
            id={title}
          />
        </p>
      </div>
      <div className="message-body has-text-centered is-size-5">
        <span style={{ marginRight: '30px', marginTop: '20px' }} className="icon is-info">
          <i className="fa fa-2x fa-magic" />
        </span>
        <FormattedMessage
          id={text}
        />
        <br /> <br />
        <Link to={to} className="button is-info is-medium">
          
          <FormattedMessage
            id={btnText}
          />
        </Link>
      </div>
    </article>
  )
}

export function Empty({ outdated, to, notificationTitle, title='Dashboard' }) {
  let text = 'dashboard.noProjectsMsg'
  let btnText = 'dashboard.noProjectsBtn'

  if (outdated) {
    text = 'dashboard.outdatedMsg'
    btnText = 'dashboard.outdatedBtn'
  }

  return (
    <Fragment>
      <div className="section-header">
        <h2>
          { title }
        </h2>
      </div>
      <div className="section">

        <div className="columns is-centered">
          <div className="column is-8">

            <EmptyMessage
              to={to}
              title={notificationTitle}
              text={text}
              btnText={btnText}
            />

          </div>
        </div>

      </div>
    </Fragment>
  )
}

export default Empty
