import React, { Component } from 'react';
import { Button, Card, CardBody, CardGroup, Col, Container, Form, Input, InputGroup, InputGroupAddon, InputGroupText, Row } from 'reactstrap';
import axios from "axios";


class Login extends Component {

  constructor(props) {
    super(props);
    this.login = this.login.bind(this);
    this.state = {
      'email': '',
      'password': ''
    }

    this.handleEmail = this.handleEmail.bind(this)
    this.handlePassword = this.handlePassword.bind(this)
  }

  componentWillMount() {
    const jwt = window.localStorage.getItem('jwt');
    if (jwt) {
      this.props.history.push('/dashboard')
    }
  }

  handleEmail(event) {
    this.setState({
      email: event.target.value
    })
  }

  handlePassword(event) {
    this.setState({
      password: event.target.value
    })
  }

  async login(event) {
    event.preventDefault();

    await axios
      .post("api/v2/auth", this.state)
      .then(res => {
        window.localStorage.setItem('jwt', res.data.token);
        window.localStorage.setItem('profile', res.data.email);
        window.localStorage.setItem('sale_center', res.data.saleCenter[0].externalId);
        window.localStorage.setItem('name_center', res.data.saleCenter[0].name)
        window.localStorage.setItem('total_sale_center', res.data.saleCenter.length)

        this.props.history.push('/dashboard');
      })
      .catch(error => {
        alert('Usuario no valido.')
        console.error(error)
      });
  }

  render() {
    return (
      <div className="app flex-row align-items-center">
        <Container>
          <Row className="justify-content-center">
            <Col md="8">
              <CardGroup>
                <Card className="p-4">
                  <CardBody>
                    <Form onSubmit={this.login} autoComplete="off">
                      <h1>Login</h1>
                      <p className="text-muted">Accede a tu cuenta.</p>
                      <InputGroup className="mb-3">
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText>
                            <i className="icon-user"></i>
                          </InputGroupText>
                        </InputGroupAddon>
                        <Input autoComplete="off" id="email" type="email" placeholder="Email" onChange={this.handleEmail} />
                      </InputGroup>
                      <InputGroup className="mb-4">
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText>
                            <i className="icon-lock"></i>
                          </InputGroupText>
                        </InputGroupAddon>
                        <Input autoComplete="off" id="password" type="password" placeholder="Password" onChange={this.handlePassword} />
                      </InputGroup>
                      <Row>
                        <Col xs={{ size: 4, offset: 8 }}>
                          <Button color="primary" className="px-4">
                            Login
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </CardBody>
                </Card>
                <Card className="text-white bg-primary py-5 d-md-down-none" style={{ width: '44%' }}>
                  <CardBody className="text-center">
                    <div>
                      <h2>Bienvenido a Orax.</h2>
                      <p>Behaviour intelligence for your bussines</p>
                    </div>
                  </CardBody>
                </Card>
              </CardGroup>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default Login;
