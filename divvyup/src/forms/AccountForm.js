import React, { Component } from 'react';
import axios from 'axios';
/* Not in this directory */
import EC2 from '../SERVER';
import NetworkError from '../atoms/NetworkError';

export default class AccountForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            networkError: undefined,
            username: '',
            password: '',
            waiting: false,
        };
    }

    onSubmit = (e) => {
        e.preventDefault();
        if (!this.props.rejectionCondition({ password: this.state.password })) {
            const { username, password } = this.state;
            this.setState({ waiting: true });
            axios
                .post(EC2 + this.props.submitRoute, { username, password })
                .then((res) => {
                    this.setState({ waiting: false });
                    this.props.handleResponse(res);
                })
                .catch((err) => {
                    console.error('Error submitting form:', err);
                    console.log(err);
                    this.setState({ networkError: err });
                });
        }
    };

    render() {
        if (this.state.networkError)
            return <NetworkError err={this.state.err} />;
        return (
            <form className='vert-form' onSubmit={this.onSubmit}>
                <div className='form-header'>{this.props.formName}</div>
                <input
                    name='username'
                    type='text'
                    maxLength='256'
                    placeholder='Username'
                    value={this.state.username}
                    onChange={(e) =>
                        this.setState({ username: e.target.value })
                    }
                    required
                />
                <input
                    name='password'
                    minLength='8'
                    maxLength='256'
                    type='password'
                    placeholder='Password'
                    value={this.state.password}
                    onChange={(e) =>
                        this.setState({ password: e.target.value })
                    }
                    required
                />
                <input
                    name='submit'
                    type='submit'
                    value='Submit'
                    style={{ display: this.state.waiting ? 'none' : 'block' }}
                />
                <div
                    className='fas fa-circle-notch fa-spin'
                    style={{ display: this.state.waiting ? 'block' : 'none' }}
                />
            </form>
        );
    }
}
