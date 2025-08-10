import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UserLogin = ({ setIsAuthenticated }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!formData.email || !formData.password) {
            setError('All fields are required');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/login', {
                email: formData.email,
                password: formData.password
            });

            localStorage.setItem('token', response.data.token);
            
            setIsAuthenticated(true);
            
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            navigate('/dashboard');
            
        } catch (err) {
            if (err.response) {
                setError(err.response.data.error || 'Login failed');
            } else if (err.request) {
                setError('Network error. Please try again.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>User Login</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleFormSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        autoComplete="username"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        autoComplete="current-password"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="submit-button"
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <div className="auth-footer">
                <p>Don't have an account? <a href="/register">Register here</a></p>
                <p><a href="/forgot-password">Forgot password?</a></p>
            </div>
        </div>
    );
};

export default UserLogin;