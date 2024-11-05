import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { loginWithEmailAndPassword } from '../services/firebase';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const { user, error: loginError } = await loginWithEmailAndPassword(email, password);

            if (loginError) {
                setError(loginError);
                return;
            }

            if (user) {
                onLogin();
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = () => {
        navigate('/signup');
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.container}>
                <h2 style={styles.title}>Login</h2>
                {error && <div style={styles.error}>{error}</div>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    disabled={isLoading}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    disabled={isLoading}
                />
                <button
                    onClick={handleLogin}
                    style={{
                        ...styles.button,
                        opacity: isLoading ? 0.7 : 1,
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
                <p style={styles.text}>
                    Don't have an account?{' '}
                    <Link to="/signup" style={styles.link}>
                        Sign up
                    </Link>
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
    error: {
        color: '#ff4444',
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '15px',
        width: '100%',
        textAlign: 'center',
    }
};

export default Login;
