import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col, Button, Image } from 'react-bootstrap';
import { Link } from 'react-router';
import FormFieldGroup from './FormFieldGroup';

class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      username: '',
      password: '',
      name: '',
      error: false,
      isLoading: false
    };
  }

  handleNameChange(e) {
    this.setState({name: e.target.value});
  }
  handleUsernameChange(e) {
    this.setState({username: e.target.value});
  }

  handlePasswordChange(e) {
    this.setState({password: e.target.value});
  }

  handleSignup() { 
    fetch('http://localhost:3000/v1/user', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: {
          name: this.state.name,
          email: this.state.username,
          password: this.state.password
        }
      })
    }) 
      .then((data) => {
        console.log(data)
        this.context.router.push('/');
      })
      .catch((err) => {
        console.error(err)
        alert('Error signing up');
      });
  }

  render() {
    const router = this.context.router;
    return (
      <Grid>
        <Row>
          <Col md={1} mdOffset={5}>
            <h1>Signup</h1>
          </Col>
        </Row>
        <form>
          <Row>
            <Col md={6} mdOffset={3}>
              <FormFieldGroup
                label='Name'
                type='text'
                value={this.state.name}
                onChange={this.handleNameChange.bind(this)}
                feedback={true}
              />
              <FormFieldGroup
                label='Username'
                type='email'
                value={this.state.username}
                onChange={this.handleUsernameChange.bind(this)}
                feedback={true}
              />
              <FormFieldGroup
                label='Password'
                type='password'
                value={this.state.password}
                onChange={this.handlePasswordChange.bind(this)}
                feedback={true}
              />
            </Col>
          </Row>
          <Row>
            <Col md={1} mdOffset={4}>
              <Button 
                bsSize='large'
                onClick={this.handleSignup.bind(this)}
              >
                Signup
              </Button>
            </Col>
          </Row>
        </form> 
      </Grid>
    );
  }
}

Signup.contextTypes = {
  router: PropTypes.object.isRequired
};

import { user } from 'actions';
const mapStateToProps = ({ user }) => ({ user });
const mapDispatchToProps = dispatch => ({
  loginUser(userData) {
    dispatch(user.login(userData));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Signup);