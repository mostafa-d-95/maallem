import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/Auth";

const ADMIN_EMAIL = "admin@maallem.com";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const sessionUser = getUser();

    const [users, setUsers] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");

    const authHeaders = () => ({
        "x-user-id": String(sessionUser?.id || ""),
        "x-user-role": String(sessionUser?.role || ""),
        "x-user-email": String(sessionUser?.email || ""),
    });

    const loadUsers = async () => {
        try {
            setError("");
            setLoading(true);

            const res = await axios.get("http://localhost:5000/api/admin/users", {
                headers: authHeaders(),
            });

            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!sessionUser) {
            navigate("/login");
            return;
        }


        const isAdmin =
            String(sessionUser.email || "").toLowerCase() ===
            ADMIN_EMAIL.toLowerCase();

        if (!isAdmin) {
            if (sessionUser.role === "provider") navigate("/provider/requests");
            else navigate("/user/search");
            return;
        }

        loadUsers();

    }, []);

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;

        return users.filter((u) => {
            const name = String(u.full_name || "").toLowerCase();
            const email = String(u.email || "").toLowerCase();
            return name.includes(q) || email.includes(q);
        });
    }, [users, query]);

    const handleDelete = async (id, fullName, email) => {
        const ok = window.confirm(
            `Delete user permanently?\n\nName: ${fullName}\nEmail: ${email}\n\nThis will delete the user and all related data.`
        );
        if (!ok) return;

        try {
            setError("");
            setDeletingId(id);

            await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
                headers: authHeaders(),
            });


            setUsers((prev) => prev.filter((u) => u.id !== id));
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || "Failed to delete user.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="app">
            <div className="form form-wide">
                <h1>Admin Dashboard</h1>

                {error && <p className="msg-error">{error}</p>}

                <div className="admin-toolbar">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    <button
                        type="button"
                        className="admin-refresh"
                        onClick={loadUsers}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>

                <div className="table-wrap">
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Phone</th>
                            <th>City</th>
                            <th>Profession</th>
                            <th>Image</th>
                            <th>Action</th>
                        </tr>
                        </thead>

                        <tbody>
                        {!loading && filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="empty-cell">
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td>{u.full_name || "-"}</td>
                                    <td>{u.email || "-"}</td>
                                    <td>{u.role || "-"}</td>
                                    <td>{u.phone || "-"}</td>
                                    <td>{u.city || "-"}</td>
                                    <td>{u.profession || "-"}</td>
                                    <td>
                                        {u.image ? (
                                            <img
                                                className="table-avatar"
                                                src={`data:image/*;base64,${u.image}`}
                                                alt="profile"
                                            />
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn-outline"
                                            onClick={() => handleDelete(u.id, u.full_name, u.email)}
                                            disabled={deletingId === u.id}
                                        >
                                            {deletingId === u.id ? "Deleting..." : "Delete User"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
