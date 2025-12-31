import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ProviderRequests = () => {
    const navigate = useNavigate();

    const [sessionUser, setSessionUser] = useState(null);
    const [requests, setRequests] = useState([]);

    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
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


    const fetchRequests = async (user) => {
        try {
            setError("");
            setLoading(true);

            const res = await axios.get(
                "http://localhost:5000/api/requests/provider",
                { headers: getAuthHeaders(user) }
            );

            setRequests(res.data || []);
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || "Failed to load requests.");
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

        if (u.role !== "provider") {
            navigate("/user/search");
            return;
        }


        const initialLoad = async () => {
            try {
                setError("");
                setLoading(true);

                const res = await axios.get(
                    "http://localhost:5000/api/requests/provider",
                    { headers: getAuthHeaders(u) }
                );

                setRequests(res.data || []);
            } catch (err) {
                console.log(err);
                setError(err.response?.data?.message || "Failed to load requests.");
            } finally {
                setLoading(false);
            }
        };

        initialLoad();
    }, [navigate]);

    const handleStatusChange = async (requestId, status) => {
        if (!sessionUser) return;

        try {
            setError("");
            setActionLoadingId(requestId);

            await axios.post(
                `http://localhost:5000/api/requests/${requestId}/status`,
                { status }, // accepted | rejected
                { headers: getAuthHeaders(sessionUser) }
            );

            await fetchRequests(sessionUser);
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || "Failed to update request status.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("maallem_user");
        navigate("/login");
    };

    return (
        <div className="app">
            <div className="form">
                <h1>Provider Requests</h1>

                <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <Link to="/account">Account</Link>
                    <button onClick={handleLogout}>Logout</button>
                </div>

                {error && <p style={{ color: "red" }}>{error}</p>}

                {loading ? (
                    <p>Loading requests...</p>
                ) : requests.length === 0 ? (
                    <p>No requests yet.</p>
                ) : (
                    requests.map((r) => (
                        <div
                            key={r.id}
                            style={{
                                border: "1px solid #ddd",
                                padding: "12px",
                                marginBottom: "10px",
                            }}
                        >
                            <p>
                                <b>From:</b> {r.userName} ({r.userEmail})
                            </p>

                            <p>
                                <b>Description:</b> {r.description}
                            </p>

                            {r.address && (
                                <p>
                                    <b>Address:</b> {r.address}
                                </p>
                            )}

                            <p>
                                <b>Status:</b> {r.status}
                            </p>

                            <p>
                                <b>Date:</b> {new Date(r.created_at).toLocaleString()}
                            </p>

                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button
                                    onClick={() => handleStatusChange(r.id, "accepted")}
                                    disabled={actionLoadingId === r.id || r.status !== "pending"}
                                >
                                    {actionLoadingId === r.id ? "Updating..." : "Accept"}
                                </button>

                                <button
                                    onClick={() => handleStatusChange(r.id, "rejected")}
                                    disabled={actionLoadingId === r.id || r.status !== "pending"}
                                >
                                    {actionLoadingId === r.id ? "Updating..." : "Reject"}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProviderRequests;
