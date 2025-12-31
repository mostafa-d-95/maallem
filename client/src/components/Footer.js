import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getUser } from "../utils/Auth";
import { FaInstagram, FaFacebookF } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const Footer = () => {
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        setUser(getUser());
    }, [location.pathname]);


    const hiddenRoutes = ["/login", "/signup"];
    if (hiddenRoutes.includes(location.pathname)) return null;


    if (!user) return null;

    return (
        <footer className="footer">
            <div className="footer-content">
                {/* Left */}
                <div className="footer-brand">
                    <h3>Maallem</h3>
                    <p>Your trusted service marketplace</p>
                </div>

                {/* Center */}
                <div className="footer-links">
                    <a href="/about">About</a>
                    <a href="/contact">Contact Us</a>
                </div>

                {/* Right — ICONS ONLY */}
                <div className="footer-social">
                    <a
                        href="https://x.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="X"
                    >
                        <FaXTwitter />
                    </a>

                    <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                    >
                        <FaInstagram />
                    </a>

                    <a
                        href="https://facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                    >
                        <FaFacebookF />
                    </a>
                </div>
            </div>

            <div className="footer-bottom">
                © {new Date().getFullYear()} Maallem. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
