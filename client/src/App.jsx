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
import MyPlaylists from './pages/MyPlaylists';
import CustomPlaylistDetails from './pages/CustomPlaylistDetails';
import PublicPlaylist from './pages/PublicPlaylist';
import LibraryPage from './pages/Library';
import Home from './pages/Home';
import ImportPage from './pages/ImportPage';
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
                        element={<FocusMode />}
                    />
                    <Route
                        path="/*"
                        element={
                            <>
                                <Navbar />
                                <div className="container" style={{ paddingTop: '5rem' }}>
                                    <Routes>
                                        <Route path="/" element={user ? <Dashboard /> : <Home />} />
                                        <Route path="/playlist/:id" element={<PlaylistDetails />} />
                                        <Route
                                            path="/dashboard"
                                            element={
                                                <ProtectedRoute>
                                                    <Dashboard />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/library"
                                            element={
                                                <ProtectedRoute>
                                                    <LibraryPage />
                                                </ProtectedRoute>
                                            }
                                        />
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

                                        {/* Custom Playlists */}
                                        <Route
                                            path="/my-playlists"
                                            element={
                                                <ProtectedRoute>
                                                    <MyPlaylists />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/custom-playlist/:id"
                                            element={
                                                <ProtectedRoute>
                                                    <CustomPlaylistDetails />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/import"
                                            element={
                                                <ProtectedRoute>
                                                    <ImportPage />
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route path="/shared-playlist/:id" element={<PublicPlaylist />} />


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
