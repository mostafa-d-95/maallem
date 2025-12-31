

const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 5000;


const ADMIN_EMAIL = "admin@maallem.com";


app.use(cors());
app.use(express.json());


const IMAGES_DIR = path.join(__dirname, "images");
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "images/"),
    filename: (req, file, cb) => {
        const safeBase = path
            .basename(file.originalname, path.extname(file.originalname))
            .replace(/\s+/g, "_")
            .replace(/[^\w-]/g, "");
        cb(null, `${safeBase}_${Date.now()}${path.extname(file.originalname)}`);
    },
});
const upload = multer({ storage });

app.use("/images", express.static(IMAGES_DIR));


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "maallem",
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err);
    } else {
        console.log("MySQL connected successfully");
    }
});


const normalizeText = (v) => {
    if (typeof v !== "string") return "";
    return v.trim();
};


const requireAuth = (req, res, next) => {
    const userId = req.headers["x-user-id"];
    const role = req.headers["x-user-role"];
    const email = req.headers["x-user-email"];

    if (!userId || !role) {
        return res.status(401).json({
            message: "Not authorized. Missing x-user-id or x-user-role headers.",
        });
    }

    req.userId = Number(userId);
    req.userRole = String(role);
    req.userEmail = email ? String(email).toLowerCase() : "";

    next();
};

const requireAdmin = (req, res, next) => {
    const role = String(req.headers["x-user-role"] || "");
    const email = String(req.headers["x-user-email"] || "").toLowerCase();


    if (role === "admin" || email === ADMIN_EMAIL.toLowerCase()) return next();

    return res.status(403).json({ message: "Admin access required." });
};

const deleteImageIfExists = (filename) => {
    if (!filename) return;
    const filePath = path.join(IMAGES_DIR, filename);
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting image:", err);
        });
    }
};

const fileToBase64OrNull = (filename) => {
    if (!filename) return null;
    const imagePath = path.join(IMAGES_DIR, filename);
    if (!fs.existsSync(imagePath)) return null;
    return fs.readFileSync(imagePath).toString("base64");
};


app.post("/api/auth/signup", upload.single("image"), (req, res) => {
    let { fullName, email, password, role, phone, city, profession, bio } = req.body;

    fullName = normalizeText(fullName);
    email = normalizeText(email).toLowerCase();
    password = normalizeText(password);
    role = normalizeText(role);
    phone = normalizeText(phone);
    city = normalizeText(city);
    profession = normalizeText(profession);
    bio = normalizeText(bio);

    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    if (!["user", "provider"].includes(role)) {
        return res.status(400).json({ message: "Invalid role." });
    }


    if (email === ADMIN_EMAIL.toLowerCase()) {

        return res.status(400).json({
            message: "This email is reserved for admin. Use another email.",
        });
    }

    if (role === "provider") {
        if (!city || !profession) {
            return res.status(400).json({
                message: "Providers must select city and profession.",
            });
        }
    }

    const image = req.file ? req.file.filename : null;

    // Create user
    const qUser =
        "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)";

    db.query(qUser, [fullName, email, password, role], (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ message: "Email already exists." });
            }
            console.log(err);
            return res.status(500).json({ message: "Signup failed.", error: err });
        }

        const userId = result.insertId;

        if (role === "user") {
            return res.json({
                message: "User signed up successfully!",
                userId,
                role,
            });
        }


        const qProvider = `
      INSERT INTO provider_profiles (user_id, phone, city, profession, bio, image)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        db.query(
            qProvider,
            [userId, phone || null, city, profession, bio || null, image],
            (err2) => {
                if (err2) {
                    console.log(err2);
                    return res.status(500).json({
                        message: "Provider profile creation failed.",
                        error: err2,
                    });
                }

                return res.json({
                    message: "Provider signed up successfully!",
                    userId,
                    role,
                });
            }
        );
    });
});


app.post("/api/auth/login", (req, res) => {
    let { email, password } = req.body;

    email = normalizeText(email).toLowerCase();
    password = normalizeText(password);

    if (!email || !password) {
        return res.status(400).json({ message: "Missing email or password." });
    }

    const q = "SELECT id, full_name, email, role FROM users WHERE email=? AND password=?";

    db.query(q, [email, password], (err, data) => {
        if (err) return res.status(500).json(err);

        if (!data || data.length === 0) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const user = data[0];


        if (user.email === ADMIN_EMAIL.toLowerCase()) {
            user.role = "admin";
        }

        return res.json({
            message: "Login successful",
            user,
        });
    });
});




app.get("/api/admin/users", requireAdmin, (req, res) => {
    const q = `
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.role,
            pp.phone,
            pp.city,
            pp.profession,
            pp.bio,
            pp.image
        FROM users u
                 LEFT JOIN provider_profiles pp ON pp.user_id = u.id
        ORDER BY u.id DESC
    `;

    db.query(q, (err, data) => {
        if (err) return res.status(500).json({ message: "Failed to load users", error: err });

        for (const row of data) {
            if (row.image) {
                const imagePath = path.join(IMAGES_DIR, row.image);
                row.image = fs.existsSync(imagePath)
                    ? fs.readFileSync(imagePath).toString("base64")
                    : null;
            }
        }

        return res.json(data);
    });
});


app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ message: "Invalid user id." });


    const qGetEmail = "SELECT email FROM users WHERE id=?";
    db.query(qGetEmail, [userId], (e0, rows0) => {
        if (e0) return res.status(500).json(e0);
        if (!rows0 || rows0.length === 0) return res.status(404).json({ message: "User not found." });

        const targetEmail = String(rows0[0].email || "").toLowerCase();
        if (targetEmail === ADMIN_EMAIL.toLowerCase()) {
            return res.status(403).json({ message: "Cannot delete the admin account." });
        }

        db.beginTransaction((txErr) => {
            if (txErr) return res.status(500).json(txErr);


            const qGetImage = "SELECT image FROM provider_profiles WHERE user_id=?";
            db.query(qGetImage, [userId], (err1, imgRows) => {
                if (err1) return db.rollback(() => res.status(500).json(err1));

                const oldImage = imgRows && imgRows.length ? imgRows[0].image : null;


                const qDeleteRequests = `
          DELETE FROM service_requests
          WHERE user_id = ? OR provider_user_id = ?
        `;
                db.query(qDeleteRequests, [userId, userId], (err2) => {
                    if (err2) return db.rollback(() => res.status(500).json(err2));

                    // 3) delete provider profile if exists
                    const qDeleteProfile = "DELETE FROM provider_profiles WHERE user_id=?";
                    db.query(qDeleteProfile, [userId], (err3) => {
                        if (err3) return db.rollback(() => res.status(500).json(err3));

                        // 4) delete user
                        const qDeleteUser = "DELETE FROM users WHERE id=?";
                        db.query(qDeleteUser, [userId], (err4, result4) => {
                            if (err4) return db.rollback(() => res.status(500).json(err4));

                            if (!result4 || result4.affectedRows === 0) {
                                return db.rollback(() => res.status(404).json({ message: "User not found." }));
                            }

                            db.commit((err5) => {
                                if (err5) return db.rollback(() => res.status(500).json(err5));

                                // delete provider image file after commit
                                if (oldImage) deleteImageIfExists(oldImage);

                                return res.json({ message: "User deleted successfully." });
                            });
                        });
                    });
                });
            });
        });
    });
});


app.get("/api/dropdowns/cities", (req, res) => {
    const q = `
    SELECT DISTINCT city
    FROM provider_profiles
    WHERE city IS NOT NULL AND city <> ''
    ORDER BY city ASC
  `;
    db.query(q, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data); // [{city:"Beirut"}, ...]
    });
});


app.get("/api/dropdowns/professions", (req, res) => {
    const q = `
    SELECT DISTINCT profession
    FROM provider_profiles
    WHERE profession IS NOT NULL AND profession <> ''
    ORDER BY profession ASC
  `;
    db.query(q, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data); // [{profession:"Plumber"}, ...]
    });
});


app.get("/api/providers/search", (req, res) => {
    const city = normalizeText(req.query.city || "");
    const profession = normalizeText(req.query.profession || "");

    const q = `
    SELECT
      p.id AS providerProfileId,
      p.user_id AS providerUserId,
      u.full_name,
      u.email,
      p.phone,
      p.city,
      p.profession,
      p.bio,
      p.image
    FROM provider_profiles p
    JOIN users u ON u.id = p.user_id
    WHERE (? = '' OR p.city = ?)
      AND (? = '' OR p.profession = ?)
    ORDER BY u.full_name ASC
  `;

    db.query(q, [city, city, profession, profession], (err, data) => {
        if (err) return res.status(500).json(err);


        for (const d of data) {
            if (d.image) d.image = fileToBase64OrNull(d.image);
        }

        return res.json(data);
    });
});


app.post("/api/requests/create", requireAuth, (req, res) => {
    // Note: if admin is logged in, they should not create requests
    if (req.userRole !== "user") {
        return res.status(403).json({ message: "Only normal users can create requests." });
    }

    const providerUserId = Number(req.body.providerUserId);
    const description = normalizeText(req.body.description);
    const address = normalizeText(req.body.address);

    if (!providerUserId || !description) {
        return res.status(400).json({ message: "Missing providerUserId or description." });
    }

    const q = `
    INSERT INTO service_requests (user_id, provider_user_id, description, address, status)
    VALUES (?, ?, ?, ?, 'pending')
  `;

    db.query(q, [req.userId, providerUserId, description, address || null], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({
            message: "Request sent successfully!",
            requestId: result.insertId,
        });
    });
});


app.get("/api/requests/provider", requireAuth, (req, res) => {
    if (req.userRole !== "provider") {
        return res.status(403).json({ message: "Only providers can view provider requests." });
    }

    const q = `
    SELECT
      r.id,
      r.description,
      r.address,
      r.status,
      r.created_at,
      u.full_name AS userName,
      u.email AS userEmail
    FROM service_requests r
    JOIN users u ON u.id = r.user_id
    WHERE r.provider_user_id = ?
    ORDER BY r.created_at DESC
  `;

    db.query(q, [req.userId], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});


app.post("/api/requests/:id/status", requireAuth, (req, res) => {
    if (req.userRole !== "provider") {
        return res.status(403).json({ message: "Only providers can update request status." });
    }

    const requestId = Number(req.params.id);
    const status = normalizeText(req.body.status);

    if (!requestId) return res.status(400).json({ message: "Invalid request id." });
    if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status." });
    }

    const q = `
    UPDATE service_requests
    SET status = ?
    WHERE id = ? AND provider_user_id = ?
  `;

    db.query(q, [status, requestId, req.userId], (err, result) => {
        if (err) return res.status(500).json(err);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Request not found (or it does not belong to you).",
            });
        }

        return res.json({ message: `Request ${status} successfully!` });
    });
});


app.get("/api/requests/user", requireAuth, (req, res) => {
    if (req.userRole !== "user") {
        return res.status(403).json({ message: "Only normal users can view user requests." });
    }

    const q = `
    SELECT
      r.id,
      r.description,
      r.address,
      r.status,
      r.created_at,
      p.full_name AS providerName,
      pp.city AS providerCity,
      pp.profession AS providerProfession
    FROM service_requests r
    JOIN users p ON p.id = r.provider_user_id
    LEFT JOIN provider_profiles pp ON pp.user_id = r.provider_user_id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `;

    db.query(q, [req.userId], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});


app.get("/api/account/me", requireAuth, (req, res) => {
    const qUser = "SELECT id, full_name, email, role FROM users WHERE id=?";

    db.query(qUser, [req.userId], (err, data) => {
        if (err) return res.status(500).json(err);
        if (!data || data.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = data[0];


        if (req.userRole === "admin") {
            return res.json({ user });
        }

        if (user.role !== "provider") {
            return res.json({ user });
        }

        const qProvider =
            "SELECT phone, city, profession, bio, image FROM provider_profiles WHERE user_id=?";

        db.query(qProvider, [req.userId], (err2, data2) => {
            if (err2) return res.status(500).json(err2);

            const providerProfile = data2 && data2.length ? data2[0] : null;

            if (providerProfile && providerProfile.image) {
                providerProfile.image = fileToBase64OrNull(providerProfile.image);
            }

            return res.json({ user, providerProfile });
        });
    });
});


app.post("/api/account/update", requireAuth, upload.single("image"), (req, res) => {
    // Admin can update their user row (optional); but no provider profile update.
    let { fullName, email, phone, city, profession, bio } = req.body;

    fullName = normalizeText(fullName);
    email = normalizeText(email).toLowerCase();
    phone = normalizeText(phone);
    city = normalizeText(city);
    profession = normalizeText(profession);
    bio = normalizeText(bio);

    if (!fullName || !email) {
        return res.status(400).json({ message: "Missing fullName or email." });
    }

    const newImage = req.file ? req.file.filename : null;

    // Update users table first
    const qUser = `UPDATE users SET full_name=?, email=? WHERE id=?`;
    db.query(qUser, [fullName, email, req.userId], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ message: "Email already exists." });
            }
            return res.status(500).json(err);
        }


        if (req.userRole !== "provider") {
            return res.json({ message: "Account updated successfully!" });
        }


        const getOld = "SELECT image FROM provider_profiles WHERE user_id=?";
        db.query(getOld, [req.userId], (errOld, oldRows) => {
            if (errOld) return res.status(500).json(errOld);

            const oldImage = oldRows && oldRows.length ? oldRows[0].image : null;
            if (newImage && oldImage && oldImage !== newImage) {
                deleteImageIfExists(oldImage);
            }

            let qProvider, values;

            if (newImage) {
                qProvider = `
          UPDATE provider_profiles
          SET phone=?, city=?, profession=?, bio=?, image=?
          WHERE user_id=?
        `;
                values = [phone || null, city || "", profession || "", bio || null, newImage, req.userId];
            } else {
                qProvider = `
          UPDATE provider_profiles
          SET phone=?, city=?, profession=?, bio=?
          WHERE user_id=?
        `;
                values = [phone || null, city || "", profession || "", bio || null, req.userId];
            }

            db.query(qProvider, values, (err2) => {
                if (err2) return res.status(500).json(err2);
                return res.json({ message: "Account updated successfully!" });
            });
        });
    });
});


app.get("/cities", (req, res) => {
    const q = "SELECT name FROM cities ORDER BY name ASC";
    db.query(q, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data); // [{name:"Beirut"}, ...]
    });
});


app.get("/professions", (req, res) => {
    const q = "SELECT name FROM professions ORDER BY name ASC";
    db.query(q, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data); // [{name:"Plumber"}, ...]
    });
});


app.get("/api/health", (req, res) => {
    res.json({ ok: true, message: "Maallem server is running." });
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
