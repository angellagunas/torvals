import React, { Component } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
// import { renderRoutes } from 'react-router-config';
import Loadable from 'react-loadable';
import './App.scss';

const loading = () => <div className="animated fadeIn pt-3 text-center">Loading...</div>;

// Containers
const DefaultLayout = Loadable({
  loader: () => import('./containers/DefaultLayout'),
  loading
});

// Pages
const Login = Loadable({
  loader: () => import('./views/Pages/Login'),
  loading
});

class App extends Component {

  render() {
    return (
      <HashRouter>
          <Switch>
            <Route exact path="/login" name="Login Page" component={Login} />
            <Route path="/" name="Home" component={DefaultLayout} />
          </Switch>
      </HashRouter>
    );
  }
}

export default App;
