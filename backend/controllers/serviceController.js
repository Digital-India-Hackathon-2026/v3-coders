const db = require("../config/db");

// Get all services across the platform (for farmers to browse/book)
const getAllServices = async (req, res) => {
  try {
    const query = `
      SELECT s.*, u.name as provider_name, u.phone as provider_phone 
      FROM services s
      JOIN users u ON s.provider_id = u.id
      WHERE s.status = 'available' AND u.status = 'active'
      ORDER BY s.created_at DESC
    `;
    const result = await db.query(query);
    res.json({ services: result.rows });
  } catch (error) {
    console.error("Get All Services Error:", error);
    res.status(500).json({ message: "Server error fetching services." });
  }
};

// Get services listed by the logged-in provider
const getProviderServices = async (req, res) => {
  try {
    const query = `
      SELECT * FROM services 
      WHERE provider_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [req.user.id]);
    res.json({ services: result.rows });
  } catch (error) {
    console.error("Get Provider Services Error:", error);
    res.status(500).json({ message: "Server error fetching provider services." });
  }
};

// Create a new service listing (provider only)
const createService = async (req, res) => {
  const { name, type, pricePerHour, description } = req.body;

  if (!name || !type || !pricePerHour) {
    return res.status(400).json({ message: "Please provide service name, type, and price per hour." });
  }

  try {
    const insertQuery = `
      INSERT INTO services (provider_id, name, type, price_per_hour, description, status) 
      VALUES ($1, $2, $3, $4, $5, 'available') 
      RETURNING *
    `;
    const result = await db.query(insertQuery, [
      req.user.id,
      name,
      type,
      pricePerHour,
      description || ""
    ]);

    res.status(201).json({
      message: "Service listing created successfully.",
      service: result.rows[0]
    });
  } catch (error) {
    console.error("Create Service Error:", error);
    res.status(500).json({ message: "Server error creating service listing." });
  }
};

// Update an existing service listing (provider owner only)
const updateService = async (req, res) => {
  const { id } = req.params;
  const { name, type, pricePerHour, description, status } = req.body;

  if (!name || !type || !pricePerHour || !status) {
    return res.status(400).json({ message: "Required fields: name, type, price per hour, status." });
  }

  try {
    // Check ownership
    const serviceCheck = await db.query("SELECT * FROM services WHERE id = $1", [id]);
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ message: "Service listing not found." });
    }

    if (serviceCheck.rows[0].provider_id !== req.user.id) {
      return res.status(403).json({ message: "Access forbidden: you do not own this service listing." });
    }

    const updateQuery = `
      UPDATE services 
      SET name = $1, type = $2, price_per_hour = $3, description = $4, status = $5 
      WHERE id = $6 
      RETURNING *
    `;
    const result = await db.query(updateQuery, [
      name,
      type,
      pricePerHour,
      description || "",
      status,
      id
    ]);

    res.json({
      message: "Service listing updated successfully.",
      service: result.rows[0]
    });
  } catch (error) {
    console.error("Update Service Error:", error);
    res.status(500).json({ message: "Server error updating service listing." });
  }
};

// Delete a service listing (provider owner only)
const deleteService = async (req, res) => {
  const { id } = req.params;

  try {
    // Check ownership
    const serviceCheck = await db.query("SELECT * FROM services WHERE id = $1", [id]);
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ message: "Service listing not found." });
    }

    if (serviceCheck.rows[0].provider_id !== req.user.id) {
      return res.status(403).json({ message: "Access forbidden: you do not own this service listing." });
    }

    await db.query("DELETE FROM services WHERE id = $1", [id]);
    res.json({ message: "Service listing deleted successfully." });
  } catch (error) {
    console.error("Delete Service Error:", error);
    res.status(500).json({ message: "Server error deleting service listing." });
  }
};

module.exports = {
  getAllServices,
  getProviderServices,
  createService,
  updateService,
  deleteService
};
