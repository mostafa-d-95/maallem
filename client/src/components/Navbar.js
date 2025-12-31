import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUser, clearUser } from "../utils/Auth";
import logo from "../assets/logo.png"; // adjust path if needed

const ADMIN_EMAIL = "admin@maallem.com";

const Navbar = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const user = getUser();


    if (
        location.pathname === "/login" ||
        location.pathname === "/signup"
    ) {
        return null;
    }

    if (!user) return null;

    const isAdmin =
        user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const handleLogout = () => {
        clearUser();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            {/* LEFT: Logo */}
            <div className="nav-left">
                <button
                    className="nav-brand"
                    onClick={() => navigate(isAdmin ? "/admin" : "/")}
                >
                    <img src={logo} alt="Maallem" className="nav-logo" />
                    Maallem
                </button>
            </div>

            {/* RIGHT */}
            <div className="nav-links-desktop">

                {isAdmin ? (
                    <button className="nav-btn" onClick={handleLogout}>
                        Logout
                    </button>
                ) : (
                    <>
                        {/* NORMAL USERS / PROVIDERS */}
                        <Link className="nav-link" to="/requests">
                            Requests
                        </Link>
                        <Link className="nav-link" to="/about">
                            About
                        </Link>
                        <Link className="nav-link" to="/contact">
                            Contact Us
                        </Link>
                        <Link className="nav-link" to="/account">
                            Account
                        </Link>

                        <button className="nav-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                )}
            </div>


            <button className="hamburger" onClick={() => setOpen(!open)}>
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
            </button>

            {open && (
                <div className="mobile-menu">
                    {isAdmin ? (
                        <button className="mobile-logout" onClick={handleLogout}>
                            Logout
                        </button>
                    ) : (
                        <>
                            <Link className="mobile-link" to="/requests">
                                Requests
                            </Link>
                            <Link className="mobile-link" to="/about">
                                About
                            </Link>
                            <Link className="mobile-link" to="/contact">
                                Contact Us
                            </Link>
                            <Link className="mobile-link" to="/account">
                                Account
                            </Link>
                            <button className="mobile-logout" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
