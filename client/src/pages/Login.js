import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {setUser} from "../utils/Auth";
const ADMIN_EMAIL = "admin@maallem.com"
const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setLoading(true);

            const res = await axios.post("http://localhost:5000/api/auth/login", {
                email,
                password,
            });

            // server returns: { message, user: { id, full_name, email, role } }
            const user = res.data.user;
            setUser(user);

            // store session (beginner-friendly)
            localStorage.setItem("maallem_user", JSON.stringify(user));

            if (
                user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
            ) {
                navigate("/admin");
                return;
            }


            if (user.role === "provider") {
                navigate("/provider/requests");
            } else {
                navigate("/user/search");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app">
            <div className="form">
                <h1>Login</h1>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button onClick={handleLogin} disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>

                {error && <p style={{ color: "red" }}>{error}</p>}

                <p>
                    Don’t have an account? <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
