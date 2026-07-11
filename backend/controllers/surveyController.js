const db = require("../config/db");

// Admin: Create a new pricing survey and broadcast to all active users
const createSurvey = async (req, res) => {
  const { title, service_type, description, deadline } = req.body;

  if (!title || !service_type || !deadline) {
    return res.status(400).json({ message: "Title, service type, and deadline are required." });
  }

  try {
    const insertQuery = `
      INSERT INTO price_surveys (title, service_type, description, deadline, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(insertQuery, [title, service_type, description || "", deadline, req.user.id]);
    const survey = result.rows[0];

    // Broadcast notification to all active farmers and providers
    const usersRes = await db.query("SELECT id FROM users WHERE role IN ('farmer', 'provider') AND status = 'active'");
    const notifMsg = `📊 New Pricing Survey: "${title}" — Admin is collecting price suggestions for ${service_type}. Share your input before ${new Date(deadline).toLocaleDateString("en-IN")}!`;

    if (usersRes.rows.length > 0) {
      const notifValues = usersRes.rows.map((u) => `(${u.id}, '${notifMsg.replace(/'/g, "''")}')`).join(",");
      await db.query(`INSERT INTO notifications (user_id, message) VALUES ${notifValues}`);
    }

    res.status(201).json({
      message: `Survey created and notifications sent to ${usersRes.rows.length} users.`,
      survey
    });
  } catch (error) {
    console.error("Create Survey Error:", error);
    res.status(500).json({ message: "Server error creating survey." });
  }
};

// Admin: Get all surveys with response counts
const getSurveys = async (req, res) => {
  try {
    const query = `
      SELECT ps.*, 
             COUNT(psr.id)::int AS response_count,
             AVG(psr.suggested_price)::numeric(10,2) AS avg_price,
             MIN(psr.suggested_price)::numeric(10,2) AS min_price,
             MAX(psr.suggested_price)::numeric(10,2) AS max_price,
             u.name AS created_by_name
      FROM price_surveys ps
      LEFT JOIN price_survey_responses psr ON ps.id = psr.survey_id
      LEFT JOIN users u ON ps.created_by = u.id
      GROUP BY ps.id, u.name
      ORDER BY ps.created_at DESC
    `;
    const result = await db.query(query);
    res.json({ surveys: result.rows });
  } catch (error) {
    console.error("Get Surveys Error:", error);
    res.status(500).json({ message: "Server error fetching surveys." });
  }
};

// Admin: Get a single survey with all responses and stats
const getSurveyById = async (req, res) => {
  const { id } = req.params;
  try {
    const surveyRes = await db.query("SELECT * FROM price_surveys WHERE id = $1", [id]);
    if (surveyRes.rows.length === 0) {
      return res.status(404).json({ message: "Survey not found." });
    }

    const responsesRes = await db.query(`
      SELECT psr.*, u.name AS user_name, u.role AS user_role
      FROM price_survey_responses psr
      JOIN users u ON psr.user_id = u.id
      WHERE psr.survey_id = $1
      ORDER BY psr.created_at DESC
    `, [id]);

    const statsRes = await db.query(`
      SELECT 
        COUNT(*)::int AS total,
        AVG(suggested_price)::numeric(10,2) AS avg_price,
        MIN(suggested_price)::numeric(10,2) AS min_price,
        MAX(suggested_price)::numeric(10,2) AS max_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY suggested_price)::numeric(10,2) AS median_price
      FROM price_survey_responses
      WHERE survey_id = $1
    `, [id]);

    res.json({
      survey: surveyRes.rows[0],
      responses: responsesRes.rows,
      stats: statsRes.rows[0]
    });
  } catch (error) {
    console.error("Get Survey By ID Error:", error);
    res.status(500).json({ message: "Server error fetching survey details." });
  }
};

// User (farmer/provider): Submit a price suggestion for a survey
const submitResponse = async (req, res) => {
  const { id } = req.params; // survey_id
  const { suggested_price, comment } = req.body;

  if (!suggested_price || isNaN(parseFloat(suggested_price)) || parseFloat(suggested_price) <= 0) {
    return res.status(400).json({ message: "Please provide a valid suggested price." });
  }

  try {
    // Check survey exists and is open
    const surveyRes = await db.query("SELECT * FROM price_surveys WHERE id = $1", [id]);
    if (surveyRes.rows.length === 0) return res.status(404).json({ message: "Survey not found." });
    if (surveyRes.rows[0].status !== "open") return res.status(400).json({ message: "This survey is closed and no longer accepting responses." });
    if (new Date(surveyRes.rows[0].deadline) < new Date()) return res.status(400).json({ message: "The deadline for this survey has passed." });

    const insertQuery = `
      INSERT INTO price_survey_responses (survey_id, user_id, suggested_price, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (survey_id, user_id) DO UPDATE SET suggested_price = $3, comment = $4
      RETURNING *
    `;
    const result = await db.query(insertQuery, [id, req.user.id, parseFloat(suggested_price), comment || ""]);

    res.status(201).json({
      message: "Your price suggestion has been submitted successfully!",
      response: result.rows[0]
    });
  } catch (error) {
    console.error("Submit Response Error:", error);
    res.status(500).json({ message: "Server error submitting your response." });
  }
};

// Admin: Finalize a survey with a recommended price and close it
const finalizeSurvey = async (req, res) => {
  const { id } = req.params;
  const { finalized_price } = req.body;

  if (!finalized_price || isNaN(parseFloat(finalized_price))) {
    return res.status(400).json({ message: "Please provide a valid finalized price." });
  }

  try {
    const updateQuery = `
      UPDATE price_surveys 
      SET status = 'closed', finalized_price = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await db.query(updateQuery, [parseFloat(finalized_price), id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Survey not found." });

    const survey = result.rows[0];

    // Notify all users of the finalized price
    const usersRes = await db.query("SELECT id FROM users WHERE role IN ('farmer', 'provider') AND status = 'active'");
    const notifMsg = `✅ Survey Finalized: Recommended price for ${survey.service_type} has been set to ₹${parseFloat(finalized_price).toFixed(2)}/hour based on community input.`;
    if (usersRes.rows.length > 0) {
      const notifValues = usersRes.rows.map((u) => `(${u.id}, '${notifMsg.replace(/'/g, "''")}')`).join(",");
      await db.query(`INSERT INTO notifications (user_id, message) VALUES ${notifValues}`);
    }

    res.json({ message: "Survey finalized and users notified.", survey });
  } catch (error) {
    console.error("Finalize Survey Error:", error);
    res.status(500).json({ message: "Server error finalizing survey." });
  }
};

// User: Get all open surveys + their own submission status
const getActiveSurveys = async (req, res) => {
  try {
    const query = `
      SELECT ps.*,
             psr.suggested_price AS my_suggestion,
             psr.comment AS my_comment,
             COUNT(psr2.id)::int AS total_responses
      FROM price_surveys ps
      LEFT JOIN price_survey_responses psr ON ps.id = psr.survey_id AND psr.user_id = $1
      LEFT JOIN price_survey_responses psr2 ON ps.id = psr2.survey_id
      WHERE ps.status = 'open' AND ps.deadline >= CURRENT_DATE
      GROUP BY ps.id, psr.suggested_price, psr.comment
      ORDER BY ps.deadline ASC
    `;
    const result = await db.query(query, [req.user.id]);
    res.json({ surveys: result.rows });
  } catch (error) {
    console.error("Get Active Surveys Error:", error);
    res.status(500).json({ message: "Server error fetching active surveys." });
  }
};

// User: Get all closed surveys with finalized prices
const getClosedSurveys = async (req, res) => {
  try {
    const query = `
      SELECT ps.*,
             psr.suggested_price AS my_suggestion,
             COUNT(psr2.id)::int AS total_responses,
             AVG(psr2.suggested_price)::numeric(10,2) AS avg_price
      FROM price_surveys ps
      LEFT JOIN price_survey_responses psr ON ps.id = psr.survey_id AND psr.user_id = $1
      LEFT JOIN price_survey_responses psr2 ON ps.id = psr2.survey_id
      WHERE ps.status = 'closed'
      GROUP BY ps.id, psr.suggested_price
      ORDER BY ps.created_at DESC
      LIMIT 10
    `;
    const result = await db.query(query, [req.user.id]);
    res.json({ surveys: result.rows });
  } catch (error) {
    console.error("Get Closed Surveys Error:", error);
    res.status(500).json({ message: "Server error fetching closed surveys." });
  }
};

module.exports = {
  createSurvey,
  getSurveys,
  getSurveyById,
  submitResponse,
  finalizeSurvey,
  getActiveSurveys,
  getClosedSurveys
};
