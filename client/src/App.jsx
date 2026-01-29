import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PlaylistDetails from './pages/PlaylistDetails';
import Profile from './pages/Profile';
import FocusMode from './pages/FocusMode';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import GroupPlaylistProgress from './pages/GroupPlaylistProgress';
import Home from './pages/Home';
import Navbar from './components/Shared/Navbar';
import LoadingScreen from './components/Shared/LoadingScreen';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen message="Checking authorization..." />;
    if (!user) return <Navigate to="/login" />;
    return children;
};

const AppRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    return (
        <Router>
            <div className="app-container">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route
                        path="/focus/:videoId"
                        element={
                            <ProtectedRoute>
                                <FocusMode />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/*"
                        element={
                            <>
                                <Navbar />
                                <div className="container" style={{ paddingTop: '2rem' }}>
                                    <Routes>
                                        <Route path="/" element={user ? <Dashboard /> : <Home />} />
                                        <Route path="/library" element={<Dashboard />} />
                                        <Route path="/playlist/:id" element={<PlaylistDetails />} />
                                        <Route
                                            path="/profile"
                                            element={
                                                <ProtectedRoute>
                                                    <Profile />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route path="/groups" element={<Groups />} />
                                        <Route path="/groups/:id" element={<GroupDetails />} />
                                        <Route path="/groups/:groupId/playlists/:playlistId" element={<GroupPlaylistProgress />} />
                                        {/* Redirect /dashboard to /library for legacy compatibility if needed */}
                                        <Route path="/dashboard" element={<Navigate to="/library" replace />} />
                                    </Routes>
                                </div>
                            </>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;
