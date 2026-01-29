import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PlaylistDetails from './pages/PlaylistDetails';
import Profile from './pages/Profile';
import Navbar from './components/Shared/Navbar';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app-container">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route
                            path="/*"
                            element={
                                <ProtectedRoute>
                                    <>
                                        <Navbar />
                                        <div className="container" style={{ paddingTop: '2rem' }}>
                                            <Routes>
                                                <Route path="/" element={<Dashboard />} />
                                                <Route path="/playlist/:id" element={<PlaylistDetails />} />
                                                <Route path="/profile" element={<Profile />} />
                                            </Routes>
                                        </div>
                                    </>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
