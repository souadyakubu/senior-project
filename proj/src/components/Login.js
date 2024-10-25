import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom

const Login = ({ onLogin }) => {
    const navigate = useNavigate(); // Initialize useNavigate
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (email && password) {
            onLogin(); // Call the onLogin function passed as a prop
        } else {
            alert('Please fill in both email and password.');
        }
    };

    const handleSignUp = () => {
        navigate('/signup'); // Use navigate for routing to the signup page
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.container}>
                <h2 style={styles.title}>Login</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                />
                <button onClick={handleLogin} style={styles.button}>
                    Login
                </button>
                <p style={styles.text}>
                    Don't have an account?{' '}
                    <span onClick={handleSignUp} style={styles.link}>
                        Sign up
                    </span>
                </p>
            </div>
        </div>
    );
};

const styles = {
    wrapper: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#121212',
        width: '100vw',
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        backgroundColor: '#1e1e1e',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
    },
    title: {
        fontSize: '28px',
        marginBottom: '20px',
        color: '#fff',
    },
    input: {
        width: '100%',
        padding: '15px',
        margin: '10px 0',
        borderRadius: '5px',
        border: '1px solid #444',
        backgroundColor: '#333',
        color: '#fff',
        fontSize: '16px',
    },
    button: {
        padding: '15px 30px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        marginTop: '20px',
    },
    text: {
        marginTop: '20px',
        color: '#bbb',
    },
    link: {
        color: '#007bff',
        cursor: 'pointer',
        textDecoration: 'underline',
    },
};

export default Login;
