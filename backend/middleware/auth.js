const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.error("verifyToken failed: No token provided. Headers:", req.headers);
    return res.status(401).json({ message: "No token provided, authorization denied." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    console.error("verifyToken failed: jwt.verify error:", error.message, "Token:", token);
    res.status(401).json({ message: "Token is not valid." });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized." });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access forbidden: insufficient permissions." });
    }
    
    next();
  };
};

module.exports = {
  verifyToken,
  checkRole,
};
