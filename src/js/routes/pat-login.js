const ipcRenderer = require('electron').ipcRenderer;

import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Link } from 'react-router-dom';
import { reduxForm, Field } from 'redux-form';
import { connect } from 'react-redux';
import { loginUserPAT } from '../actions';
import { isUserEitherLoggedIn } from '../utils/helpers';

export const validate = values => {
  const errors = {};
  if (!values.username) {
    errors.username = 'Required';
  }

  if (!values.access_token) {
    // 20
    errors.access_token = 'Required';
  }

  return errors;
};

const renderField = (
  { name, input, label, placeholder, meta: { touched, error } } // eslint-disable-line react/prop-types
) =>
  <div className={touched && error ? 'form-group has-danger' : 'form-group'}>
    <label htmlFor={input.name}>{label}</label>
    <div>
      {name === "username" && <div class="input-group-prepend"><div class="input-group-text">@</div></div>}
      <input
        {...input}
        className="form-control"
        placeholder={placeholder}
        type="text"
      />

      {touched && error && <div className="form-control-feedback">{error}</div>}
    </div>
  </div>;

export class PATLogin extends React.Component {
  static propTypes = {
    isEitherLoggedIn: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.isEitherLoggedIn) {
      ipcRenderer.send('reopen-window');
    }
  }

  handleSubmit(data, dispatch) {
    dispatch(loginUserPAT(data));
  }

  render() {
    if (this.props.isEitherLoggedIn) {
      return <Redirect to="/" />;
    }

    return (
      <div className="container-fluid main-container login">
        <div className="d-flex flex-row-reverse">
          <Link to="/login" className="btn btn-close" replace>
            <i className="fa fa-close" />
          </Link>
        </div>

        <div className="desc">Login to GitHub using Personal Access Token.</div>

        <form onSubmit={this.props.handleSubmit(this.handleSubmit)}>
          <Field
            name="username"
            component={renderField}
            label="Username"
            placeholder="username"
          />

          <Field
            name="access_token"
            component={renderField}
            label="Personal access token"
            placeholder="ABC123DEF456"
          />

          <button className="btn btn-md btn-login mt-2" type="submit">
            <i className="fa fa-github" /> Login to GitHub
          </button>
        </form>
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return {
    isEitherLoggedIn: isUserEitherLoggedIn(state.auth),
  };
}

export default connect(mapStateToProps, null)(
  reduxForm({
    form: 'loginPAT',
    // Use for development
    // initialValues: {
    //   hostname: 'github.example.com',
    //   clientId: '1231231231',
    //   clientSecret: 'ABC123ABCDABC123ABCDABC123ABCDABC123ABCD',
    // },
    validate,
  })(PATLogin)
);
