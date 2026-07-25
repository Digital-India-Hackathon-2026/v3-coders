const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

// Register a new user
const register = async (req, res) => {
  const { name, email, password, phone, role, extraInfo } = req.body;

  if (!name || !email || !password || !phone || !role) {
    return res.status(400).json({ message: "Please fill in all required fields." });
  }

  try {
    // Check if user already exists
    const userExist = await db.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into DB
    const insertQuery = `
      INSERT INTO users (name, email, password, phone, role, extra_info) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, name, email, phone, role, extra_info, status, created_at
    `;
    const result = await db.query(insertQuery, [
      name,
      email.toLowerCase(),
      hashedPassword,
      phone,
      role,
      extraInfo || ""
    ]);

    const newUser = result.rows[0];

    // Create JWT only if admin (active), otherwise return just user for pending flow
    let token = null;
    let message = "Registration successful. Your account is pending admin approval.";
    
    if (newUser.role === "admin" || newUser.status === "active") {
      token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      message = "Registration successful.";
    }

    res.status(201).json({
      message,
      token, // will be null for farmers/providers until we update it to active, but we return it for structure
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        extraInfo: newUser.extra_info,
        status: newUser.status
      }
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// Login user
const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: "Please provide email, password, and role." });
  }

  try {
    // Fetch user
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];

    // Check role match
    if (user.role !== role) {
      return res.status(400).json({ message: `Access denied. Registered role is '${user.role}' not '${role}'.` });
    }

    // Check account status
    if (user.status === "pending") {
      return res.status(403).json({ message: "Your account is under review. Please wait for admin approval." });
    }
    if (user.status === "suspended") {
      return res.status(403).json({ message: "Your account is suspended. Please contact the administrator." });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        extraInfo: user.extra_info,
        status: user.status
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};

// Get current profile
const getProfile = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, phone, role, extra_info, status, documents, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        extraInfo: user.extra_info,
        status: user.status,
        documents: user.documents
      }
    });

  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server error retrieving profile." });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  const { name, phone, extraInfo } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: "Name and phone fields are required." });
  }

  try {
    const updateQuery = `
      UPDATE users 
      SET name = $1, phone = $2, extra_info = $3 
      WHERE id = $4 
      RETURNING id, name, email, phone, role, extra_info, status
    `;
    const result = await db.query(updateQuery, [name, phone, extraInfo || "", req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const updatedUser = result.rows[0];
    res.json({
      message: "Profile updated successfully.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        extraInfo: updatedUser.extra_info,
        status: updatedUser.status
      }
    });

  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error updating profile." });
  }
};

const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Nodemailer config — uses explicit SMTP for reliability on production
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Please provide an email." });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    if (result.rows.length === 0) {
      // Security: don't reveal if email exists or not
      return res.json({ message: "If that email is registered, a reset link has been sent." });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await db.query(
      "UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3",
      [resetToken, resetExpires, email.toLowerCase()]
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Premium HTML email template
    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid #334155;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#10b981);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;letter-spacing:-0.5px;">🌾 KisanSeeva</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Connecting Rural India</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:22px;font-weight:700;">Password Reset Request</h2>
            <p style="margin:0 0 12px;color:#94a3b8;font-size:15px;line-height:1.6;">Hi <strong style="color:#e2e8f0;">${user.name}</strong>,</p>
            <p style="margin:0 0 28px;color:#94a3b8;font-size:15px;line-height:1.6;">We received a request to reset your KisanSeeva password. Click the button below to set a new password. This link will expire in <strong style="color:#34d399;">1 hour</strong>.</p>
            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:linear-gradient(135deg,#059669,#10b981);border-radius:12px;padding:1px;">
                  <a href="${resetUrl}" style="display:block;padding:14px 40px;background:linear-gradient(135deg,#059669,#10b981);border-radius:12px;color:#fff;font-size:16px;font-weight:700;text-decoration:none;text-align:center;">Reset My Password</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or copy and paste this link in your browser:</p>
            <p style="margin:0 0 28px;word-break:break-all;"><a href="${resetUrl}" style="color:#34d399;font-size:13px;">${resetUrl}</a></p>
            <hr style="border:none;border-top:1px solid #334155;margin:0 0 24px;">
            <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0f172a;padding:20px 40px;text-align:center;border-top:1px solid #1e293b;">
            <p style="margin:0;color:#334155;font-size:12px;">© 2026 KisanSeeva Technologies Pvt. Ltd. · Hyderabad, India</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️  EMAIL_USER or EMAIL_PASS not set. Running in dev mode.");
      return res.json({
        message: "Dev Mode: Email credentials not configured.",
        devResetToken: resetToken
      });
    }

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"KisanSeeva" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🔐 Reset Your KisanSeeva Password",
        text: `Reset your password here: ${resetUrl}\n\nThis link expires in 1 hour.`,
        html: htmlBody,
      });
      console.log(`✅ Password reset email sent to ${email}`);
      res.json({ message: "Password reset link sent to your email." });
    } catch (mailError) {
      console.error("❌ Mail send failed:", mailError.message, mailError.code);
      res.status(500).json({
        message: "Failed to send email. Please check server email configuration.",
        error: mailError.message
      });
    }

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error processing request." });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required." });
  }

  try {
    const result = await db.query(
      "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    const user = result.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2",
      [hashedPassword, user.id]
    );

    res.json({ message: "Password has been successfully reset. You can now login." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error resetting password." });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword
};
