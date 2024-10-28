import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerWithEmailAndPassword } from '../services/firebase';
import { updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';

const SignUp = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(''); // Add error state
    const [isLoading, setIsLoading] = useState(false); // Add loading state

    const handleSignUp = async () => {
        // Reset error state
        setError('');

        // Validate inputs
        if (!username || !email || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password should be at least 6 characters long.');
            return;
        }

        try {
            setIsLoading(true);
            
            // Register user with Firebase
            const { user, error: registerError } = await registerWithEmailAndPassword(email, password);
            
            if (registerError) {
                setError(registerError);
                return;
            }

            if (user) {
                // Update user profile with username
                await updateProfile(auth.currentUser, {
                    displayName: username
                });

                // Navigate to home page after successful registration
                navigate('/');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.container}>
                <h2 style={styles.title}>Sign Up</h2>
                {error && <div style={styles.error}>{error}</div>}
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                    disabled={isLoading}
                />
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
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={styles.input}
                    disabled={isLoading}
                />
                <button 
                    onClick={handleSignUp} 
                    style={{
                        ...styles.button,
                        opacity: isLoading ? 0.7 : 1,
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Signing up...' : 'Sign Up'}
                </button>
                <p style={styles.text}>
                    Already have an account?{' '}
                    <Link to="/" style={styles.link}>
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

// Keep existing styles and add new ones
const styles = {
    // ... (keep all existing styles)
    error: {
        color: '#ff4444',
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '15px',
        width: '100%',
        textAlign: 'center',
    },
    // ... (rest of your existing styles)
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

export default SignUp;