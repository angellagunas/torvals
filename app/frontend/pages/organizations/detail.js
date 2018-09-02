import React, { Component } from 'react';
import { branch } from 'baobab-react/higher-order';
import PropTypes from 'baobab-react/prop-types';
import api from '~base/api';
import Loader from '~base/components/spinner';

import Page from '~base/page';
import { loggedIn, verifyRole } from '~base/middlewares/';
import OrganizationForm from './form';
import Breadcrumb from '~base/components/base-breadcrumb';
import NotFound from '~base/components/not-found';

class OrganizationDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      loaded: false,
      organization: {},
      isLoading: '',
    };
  }

  componentWillMount() {
    this.context.tree.set('organizations', {
      page: 1,
      totalItems: 0,
      items: [],
      pageLength: 10,
    });
    this.context.tree.commit();
    this.load();
  }

  async load() {
    var url = '/app/organizations/' + this.props.match.params.uuid;

    try {
      const body = await api.get(url);

      this.setState({
        organization: body.data,
        loaded: true,
        loading: false,
      });
    } catch (e) {
      await this.setState({
        loading: false,
        loaded: true,
        notFound: true,
      });
    }
  }

  submitHandler() {
    this.setState({ isLoading: ' is-loading' });
  }

  errorHandler() {
    this.setState({ isLoading: '' });
  }

  finishUpHandler() {
    this.setState({ isLoading: '' });
  }

  render() {
    const { organization } = this.state;

    if (this.state.notFound) {
      return <NotFound msg="esta organización" />;
    }

    if (!organization.uuid || !this.state.loaded) {
      return <Loader />;
    }

    return (
      <div className="wizard">
        <div className="section-header">
          <h2>{organization.name}</h2>
        </div>
        <Breadcrumb
          path={[
            {
              path: '/',
              label: 'Inicio',
              current: false,
            },
            {
              path: '/organizations/',
              label: organization.name,
              current: true,
            },
          ]}
          align="left"
        />
        <div className="section pad-sides has-20-margin-top">
          <OrganizationForm
            baseUrl="/app/organizations"
            url={'/app/organizations/' + this.props.match.params.uuid}
            initialState={this.state.organization}
            load={this.load.bind(this)}
            submitHandler={data => this.submitHandler(data)}
            errorHandler={data => this.errorHandler(data)}
            finishUp={data => this.finishUpHandler(data)}
          />
        </div>
      </div>
    );
  }
}

OrganizationDetail.contextTypes = {
  tree: PropTypes.baobab,
};

const branchedOrganizationDetail = branch(
  { organizations: 'organizations' },
  OrganizationDetail
);

export default Page({
  path: '/manage/organizations/:uuid',
  title: 'User details',
  exact: true,
  roles: 'admin, orgadmin, analyst, manager-level-3',
  validate: [loggedIn, verifyRole],
  component: branchedOrganizationDetail,
});
