import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Account = () => {
    const navigate = useNavigate();

    const [sessionUser, setSessionUser] = useState(null);


    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");


    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [profession, setProfession] = useState("");
    const [bio, setBio] = useState("");


    const [image, setImage] = useState(null);
    const [currentImage, setCurrentImage] = useState(null); // base64 from server

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const getStoredUser = () => {
        try {
            const raw = localStorage.getItem("maallem_user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const getAuthHeaders = (user) => {
        if (!user?.id || !user?.role) return {};
        return {
            "x-user-id": String(user.id),
            "x-user-role": String(user.role),
        };
    };

    const fetchAccount = async (user) => {
        try {
            setError("");
            setLoading(true);

            const res = await axios.get("http://localhost:5000/api/account/me", {
                headers: getAuthHeaders(user),
            });

            const u = res.data.user;

            setFullName(u.full_name || "");
            setEmail(u.email || "");

            if (u.role === "provider" && res.data.providerProfile) {
                const p = res.data.providerProfile;

                setPhone(p.phone || "");
                setCity(p.city || "");
                setProfession(p.profession || "");
                setBio(p.bio || "");
                setCurrentImage(p.image || null); // base64
            } else {
                setPhone("");
                setCity("");
                setProfession("");
                setBio("");
                setCurrentImage(null);
            }
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || "Failed to load account info.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const u = getStoredUser();
        setSessionUser(u);

        if (!u) {
            navigate("/login");
            return;
        }

        fetchAccount(u);
    }, [navigate]);

    const handleFile = (e) => {
        setImage(e.target.files[0] || null);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!sessionUser) return;

        if (!fullName || !email) {
            setError("Full name and email are required.");
            return;
        }

        try {
            setError("");
            setSaving(true);

            const formData = new FormData();
            formData.append("fullName", fullName);
            formData.append("email", email);

            if (sessionUser.role === "provider") {
                formData.append("phone", phone);
                formData.append("city", city);
                formData.append("profession", profession);
                formData.append("bio", bio);
                if (image) formData.append("image", image);
            }

            await axios.post("http://localhost:5000/api/account/update", formData, {
                headers: {
                    ...getAuthHeaders(sessionUser),
                    "Content-Type": "multipart/form-data",
                },
            });


            const updatedUser = {
                ...sessionUser,
                full_name: fullName,
                email: email,
            };
            localStorage.setItem("maallem_user", JSON.stringify(updatedUser));
            setSessionUser(updatedUser);

            // reload from server (to refresh provider image + fields)
            await fetchAccount(updatedUser);

            alert("Account updated successfully!");
            setImage(null);
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || "Failed to update account.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("maallem_user");
        navigate("/login");
    };

    const handleBack = () => {
        if (!sessionUser) return navigate("/login");
        if (sessionUser.role === "provider") return navigate("/provider/requests");
        return navigate("/user/search");
    };

    return (
        <div className="app">
            <div className="form">
                <h1>Account</h1>

                <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <button onClick={handleBack}>Back</button>
                    <button onClick={handleLogout}>Logout</button>
                    {sessionUser?.role === "provider" ? (
                        <Link to="/provider/requests">Requests</Link>
                    ) : (
                        <Link to="/user/search">Search</Link>
                    )}
                </div>

                {error && <p style={{ color: "red" }}>{error}</p>}

                {loading ? (
                    <p>Loading account...</p>
                ) : (
                    <form onSubmit={handleSave}>
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

                        {sessionUser?.role === "provider" && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />

                                <input
                                    type="text"
                                    placeholder="City"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                />

                                <input
                                    type="text"
                                    placeholder="Profession"
                                    value={profession}
                                    onChange={(e) => setProfession(e.target.value)}
                                />

                                <input
                                    type="text"
                                    placeholder="Bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                />

                                <div style={{ marginTop: "10px" }}>
                                    <p style={{ margin: "0 0 6px 0" }}>
                                        <b>Current Image</b>
                                    </p>

                                    {currentImage ? (
                                        <img
                                            src={`data:image/*;base64,${currentImage}`}
                                            alt="profile"
                                            style={{
                                                width: "120px",
                                                height: "120px",
                                                objectFit: "cover",
                                                border: "1px solid #ddd",
                                            }}
                                        />
                                    ) : (
                                        <p>No image uploaded.</p>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFile}
                                    style={{ marginTop: "10px" }}
                                />
                            </>
                        )}

                        <button type="submit" disabled={saving} style={{ marginTop: "12px" }}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Account;
