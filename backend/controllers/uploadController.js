const db = require("../config/db");

const uploadDocuments = async (req, res) => {
  try {
    const userId = req.body.userId; // we will pass userId from frontend after successful registration (since it's pending)
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: "No documents uploaded." });
    }

    const documents = {};
    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/`;

    if (files.aadhar) {
      documents.aadhar = baseUrl + files.aadhar[0].filename;
    }
    if (files.selfie) {
      documents.selfie = baseUrl + files.selfie[0].filename;
    }
    if (files.driving_license) {
      documents.driving_license = baseUrl + files.driving_license[0].filename;
    }

    // Merge with any existing documents
    const fetchQuery = "SELECT documents FROM users WHERE id = $1";
    const userRes = await db.query(fetchQuery, [userId]);
    
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const existingDocs = userRes.rows[0].documents || {};
    const updatedDocs = { ...existingDocs, ...documents };

    const updateQuery = "UPDATE users SET documents = $1 WHERE id = $2 RETURNING id, documents";
    const result = await db.query(updateQuery, [updatedDocs, userId]);

    res.json({
      message: "Documents uploaded successfully.",
      documents: result.rows[0].documents
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Server error during document upload." });
  }
};

module.exports = {
  uploadDocuments
};
