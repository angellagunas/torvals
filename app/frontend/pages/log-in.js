import React, { Component } from 'react';
import Page from '~base/page';
import Link from '~base/router/link';
import { forcePublic } from '~base/middlewares/';
import AbraxasLogo from '../../public/img/abraxas-logo.svg';
import LogInButton from './landing/log-in-form';

class LogIn extends Component {
  render() {
    return (
      <div className="landing">
        <div className="center">
            <LogInButton />
        </div>
      </div>
    );
  }
}

export default Page({
  path: '/log-in',
  exact: true,
  validate: forcePublic,
  component: LogIn,
});
