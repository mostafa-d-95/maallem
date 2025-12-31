import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserSearch from "./pages/UserSearch";
import ProviderRequests from "./pages/ProviderRequests";
import Account from "./pages/Account";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminDashboard   from "./pages/AdminDashboard";

import { getUser } from "./utils/Auth";
import Footer from "./components/Footer";

const RequireAuth = ({ children }) => {
    const user = getUser();
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

const RequireRole = ({ role, children }) => {
    const user = getUser();
    if (!user) return <Navigate to="/login" replace />;

    if (user.role !== role) {
        return user.role === "provider" ? (
            <Navigate to="/provider/requests" replace />
        ) : (
            <Navigate to="/user/search" replace />
        );
    }

    return children;
};

const App = () => {
    return (
        <BrowserRouter>
            <Navbar />

            <Routes>
                {/* Public */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected */}
                <Route
                    path="/user/search"
                    element={
                        <RequireRole role="user">
                            <UserSearch />
                        </RequireRole>
                    }
                />

                <Route
                    path="/provider/requests"
                    element={
                        <RequireRole role="provider">
                            <ProviderRequests />
                        </RequireRole>
                    }
                />

                <Route
                    path="/account"
                    element={
                        <RequireAuth>
                            <Account />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/about"
                    element={
                        <RequireAuth>
                            <About />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/contact"
                    element={
                        <RequireAuth>
                            <Contact />
                        </RequireAuth>
                    }
                />

                {/* Default */}
                <Route
                    path="/"
                    element={
                        (() => {
                            const user = getUser();
                            if (!user) return <Navigate to="/login" replace />;
                            return user.role === "provider" ? (
                                <Navigate to="/provider/requests" replace />
                            ) : (
                                <Navigate to="/user/search" replace />
                            );
                        })()
                    }
                />
                <Route path="admin" element={<AdminDashboard />} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
<Footer/>
        </BrowserRouter>


    );
};

export default App;
