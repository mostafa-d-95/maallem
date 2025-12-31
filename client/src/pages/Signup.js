import axios from "axios";
import React, {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";

const Signup = () => {
    const navigate = useNavigate();


    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");


    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [profession, setProfession] = useState("");
    const [bio, setBio] = useState("");
    const [image, setImage] = useState(null);


    const [cities, setCities] = useState([]);
    const [professions, setProfessions] = useState([]);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [citiesRes, profRes] = await Promise.all([
                    axios.get("http://localhost:5000/cities"),
                    axios.get("http://localhost:5000/professions"),
                ]);

                setCities(citiesRes.data);
                setProfessions(profRes.data);

                if (citiesRes.data.length > 0) setCity(citiesRes.data[0].name);
                if (profRes.data.length > 0) setProfession(profRes.data[0].name);
            } catch (err) {
                console.error(err);
                setError("Failed to load signup data");
            }
        };

        fetchDropdowns();
    }, []);


    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };


    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");

        if (!fullName || !email || !password) {
            setError("Please fill all required fields.");
            return;
        }

        if (role === "provider" && (!city || !profession)) {
            setError("Provider must select city and profession.");
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("fullName", fullName);
            formData.append("email", email);
            formData.append("password", password);
            formData.append("role", role);

            if (role === "provider") {
                formData.append("phone", phone);
                formData.append("city", city);
                formData.append("profession", profession);
                formData.append("bio", bio);


                if (image) {
                    formData.append("image", image);
                }
            }

            await axios.post(
                "http://localhost:5000/api/auth/signup",
                formData,
                {headers: {"Content-Type": "multipart/form-data"}}
            );

            navigate("/login");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="app">
            <div className="form">
                <h1>Create Account</h1>

                <input
                    type="text"
                    placeholder="Full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                />

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

                <select  value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="user">Normal User</option>
                    <option value="provider">Service Provider</option>
                </select>

                {role === "provider" && (
                    <>
                        <input
                            type="text"
                            placeholder="Phone (optional)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />

                        <select value={city} onChange={(e) => setCity(e.target.value)}>
                            {cities.map((c) => (
                                <option key={c.name} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={profession}
                            onChange={(e) => setProfession(e.target.value)}
                        >
                            {professions.map((p) => (
                                <option key={p.name} value={p.name}>
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            placeholder="Short bio (optional)"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />


                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </>
                )}

                <button onClick={handleSignup} disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                </button>

                {error && <p style={{color: "red"}}>{error}</p>}

                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
