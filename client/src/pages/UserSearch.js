
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const UserSearch = () => {
    const navigate = useNavigate();


    const [sessionUser, setSessionUser] = useState(null);


    const [cities, setCities] = useState([]);
    const [professions, setProfessions] = useState([]);


    const [city, setCity] = useState("");
    const [profession, setProfession] = useState("");


    const [providers, setProviders] = useState([]);


    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");


    const [loading, setLoading] = useState(false);
    const [requestLoadingId, setRequestLoadingId] = useState(null);
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


    useEffect(() => {
        const u = getStoredUser();
        setSessionUser(u);


        if (!u) {
            navigate("/login");
            return;
        }
        if (u.role !== "user") {
            navigate("/provider/requests");
            return;
        }

        const fetchDropdowns = async () => {
            try {
                setError("");
                const [citiesRes, profRes] = await Promise.all([
                    axios.get("http://localhost:5000/cities"),
                    axios.get("http://localhost:5000/professions"),
                ]);

                const citiesData = citiesRes.data || [];
                const profData = profRes.data || [];

                setCities(citiesData);
                setProfessions(profData);

                // default selections
                if (citiesData.length > 0) setCity(citiesData[0].name);
                if (profData.length > 0) setProfession(profData[0].name);
            } catch (err) {
                console.log(err);
                setError("Failed to load dropdown data.");
            }
        };

        fetchDropdowns();
    }, [navigate]);


    const handleSearch = async (e) => {
        e.preventDefault();

        try {
            setError("");
            setLoading(true);

            const res = await axios.get("http://localhost:5000/api/providers/search", {
                params: { city, profession },
            });

            setProviders(res.data || []);
        } catch (err) {
            console.log(err);
            setError("Failed to search providers.");
        } finally {
            setLoading(false);
        }
    };


    const handleSendRequest = async (providerUserId) => {
        if (!sessionUser) {
            navigate("/login");
            return;
        }

        if (!description.trim()) {
            setError("Please write a short description before sending a request.");
            return;
        }

        try {
            setError("");
            setRequestLoadingId(providerUserId);

            await axios.post(
                "http://localhost:5000/api/requests/create",
                {
                    providerUserId,
                    description,
                    address,
                },
                {
                    headers: getAuthHeaders(sessionUser),
                }
            );

            alert("Request sent successfully!");
            setDescription("");
            setAddress("");


        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || "Failed to send request.");
        } finally {
            setRequestLoadingId(null);
        }
    };


    return (
        <div className="app">
            <div className="form">
                <h1>Search Service Providers</h1>

                {error && <p style={{ color: "red" }}>{error}</p>}

                <form onSubmit={handleSearch}>
                    <label>City</label>
                    <select value={city} onChange={(e) => setCity(e.target.value)}>
                        {cities.map((c) => (
                            <option key={c.name} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <label>Profession</label>
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

                    <button type="submit" disabled={loading}>
                        {loading ? "Searching..." : "Search"}
                    </button>
                </form>

                <hr />

                <h2>Request details</h2>
                <input
                    type="text"
                    placeholder="Describe your problem (required)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Address (optional)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />

                <hr />

                <h2>Results</h2>

                {providers.length === 0 ? (
                    <p>No providers found.</p>
                ) : (
                    providers.map((p) => (
                        <div
                            key={p.providerUserId}
                            style={{
                                border: "1px solid #ddd",
                                padding: "12px",
                                marginBottom: "10px",
                            }}
                        >
                            <p>
                                <b>Name:</b> {p.full_name}
                            </p>
                            <p>
                                <b>City:</b> {p.city}
                            </p>
                            <p>
                                <b>Profession:</b> {p.profession}
                            </p>
                            {p.phone && (
                                <p>
                                    <b>Phone:</b> {p.phone}
                                </p>
                            )}
                            {p.bio && (
                                <p>
                                    <b>Bio:</b> {p.bio}
                                </p>
                            )}


                            {p.image && (
                                <img
                                    src={`data:image/*;base64,${p.image}`}
                                    alt="provider"
                                    style={{ width: "120px", height: "120px", objectFit: "cover" }}
                                />
                            )}

                            <div style={{ marginTop: "10px" }}>
                                <button
                                    onClick={() => handleSendRequest(p.providerUserId)}
                                    disabled={requestLoadingId === p.providerUserId}
                                >
                                    {requestLoadingId === p.providerUserId
                                        ? "Sending..."
                                        : "Send Request"}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UserSearch;
