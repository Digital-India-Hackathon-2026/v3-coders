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

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password",
  },
});

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: "Please provide an email." });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No account with that email exists." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    // Token expires in 1 hour
    const resetExpires = new Date(Date.now() + 3600000); 

    await db.query(
      "UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3",
      [resetToken, resetExpires, email.toLowerCase()]
    );

    // Create reset URL
    // We assume the frontend is running on localhost:5173 for local dev, you can update this via env
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || "KisanSeeva",
      to: email,
      subject: "Password Reset Request - KisanSeeva",
      text: `You requested a password reset. Click this link to set a new password: \n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to set a new password.</p><p>If you did not request this, please ignore this email.</p>`
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: "Password reset link sent to your email." });
    } catch (mailError) {
      console.error("Mail send error (Check EMAIL_USER/EMAIL_PASS):", mailError);
      // Fallback for dev if email isn't configured
      res.json({ 
        message: "Dev Mode: Email not configured properly, but token generated.", 
        devResetToken: resetToken 
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
