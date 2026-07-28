const db = require("../config/db");

// Create a new booking request (Farmer only)
const createBooking = async (req, res) => {
  const { serviceId, bookingDate, hoursRequired, location, farmLat, farmLng } = req.body;

  if (!serviceId || !bookingDate || !hoursRequired || !location) {
    return res.status(400).json({ message: "Please provide serviceId, date, hours, and location." });
  }

  try {
    // 1. Fetch service to get hourly rate and check availability
    const serviceRes = await db.query("SELECT * FROM services WHERE id = $1", [serviceId]);
    if (serviceRes.rows.length === 0) {
      return res.status(404).json({ message: "Service listing not found." });
    }

    const service = serviceRes.rows[0];
    if (service.status !== "available") {
      return res.status(400).json({ message: "This service is currently not available for bookings." });
    }

    // Calculate total price
    const totalPrice = parseFloat(service.price_per_hour) * parseFloat(hoursRequired);

    // 2. Insert booking
    const insertQuery = `
      INSERT INTO bookings (farmer_id, service_id, booking_date, hours_required, total_price, status, location, farm_lat, farm_lng) 
      VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8) 
      RETURNING *
    `;
    const result = await db.query(insertQuery, [
      req.user.id,
      serviceId,
      bookingDate,
      hoursRequired,
      totalPrice,
      location,
      farmLat || null,
      farmLng || null
    ]);

    // 3. Create notification for provider
    const notifQuery = `
      INSERT INTO notifications (user_id, message) 
      VALUES ($1, $2)
    `;
    const notifMessage = `New booking request received for ${service.name} on ${bookingDate}.`;
    await db.query(notifQuery, [service.provider_id, notifMessage]);

    // --- Proximity Notification: Notify all providers within 20km ---
    if (farmLat && farmLng) {
      try {
        // Haversine formula in SQL
        const nearbyProviders = await db.query(`
          SELECT DISTINCT u.id, u.name
          FROM users u
          JOIN services s ON s.provider_id = u.id
          WHERE u.role = 'provider'
            AND u.status = 'active'
            AND s.status = 'available'
            AND u.lat IS NOT NULL AND u.lng IS NOT NULL
            AND (
              6371 * acos(
                cos(radians($1)) * cos(radians(u.lat)) *
                cos(radians(u.lng) - radians($2)) +
                sin(radians($1)) * sin(radians(u.lat))
              )
            ) <= 20
        `, [farmLat, farmLng]);
        
        for (const provider of nearbyProviders.rows) {
          // Skip the provider who was already directly notified
          if (provider.id === service.provider_id) continue;
          const msg = `📍 New booking request nearby! A farmer in your area (${location}) needs ${service.name} on ${bookingDate}. Check the platform to offer your services.`;
          await db.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [provider.id, msg]);
        }
        console.log(`✅ Notified ${nearbyProviders.rows.length} nearby providers within 20km.`);
      } catch (proxErr) {
        console.error('Proximity notification error (non-fatal):', proxErr.message);
      }
    }
    // --- End Proximity Notification ---

    res.status(201).json({
      message: "Booking request submitted successfully.",
      booking: result.rows[0]
    });

  } catch (error) {
    console.error("Create Booking Error:", error);
    res.status(500).json({ message: "Server error creating booking request." });
  }
};

const getFarmerBookings = async (req, res) => {
  try {
    const query = `
      SELECT b.*, s.name as service_name, s.type as service_type, s.price_per_hour, 
             COALESCE(s.pricing_model, 'hourly') as pricing_model, 
             s.provider_id as provider_user_id,
             u.name as provider_name, u.phone as provider_phone 
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON s.provider_id = u.id
      WHERE b.farmer_id = $1 
      ORDER BY b.booking_date DESC, b.created_at DESC
    `;
    const result = await db.query(query, [req.user.id]);
    res.json({ bookings: result.rows });
  } catch (error) {
    console.error("Get Farmer Bookings Error:", error);
    res.status(500).json({ message: "Server error fetching bookings." });
  }
};


// Get booking requests received by the logged-in provider
const getProviderBookings = async (req, res) => {
  try {
    const query = `
      SELECT b.*, s.name as service_name, s.type as service_type, s.price_per_hour, COALESCE(s.pricing_model, 'hourly') as pricing_model, u.name as farmer_name, u.phone as farmer_phone 
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.farmer_id = u.id
      WHERE s.provider_id = $1 
      ORDER BY b.booking_date DESC, b.created_at DESC
    `;
    const result = await db.query(query, [req.user.id]);
    res.json({ bookings: result.rows });
  } catch (error) {
    console.error("Get Provider Bookings Error:", error);
    res.status(500).json({ message: "Server error fetching service requests." });
  }
};

// Update booking status (accept, reject, cancel, complete)
const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'confirmed', 'completed', 'cancelled', 'rejected'

  const allowedStatuses = ["confirmed", "completed", "cancelled", "rejected"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid booking status." });
  }

  try {
    // Fetch booking details
    const bookingRes = await db.query(
      "SELECT b.*, s.provider_id FROM bookings b JOIN services s ON b.service_id = s.id WHERE b.id = $1",
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const booking = bookingRes.rows[0];

    // Ownership check & transition validation
    if (req.user.role === "farmer") {
      // Farmer can only cancel their own booking, and only if it's pending or confirmed
      if (Number(booking.farmer_id) !== Number(req.user.id)) {
        console.warn(`403 updateBookingStatus: farmer_id ${booking.farmer_id} != user.id ${req.user.id}`);
        return res.status(403).json({ message: "Access forbidden: this booking is not yours." });
      }
      if (status !== "cancelled") {
        return res.status(400).json({ message: "Farmers can only set booking status to 'cancelled'." });
      }
      if (booking.status === "completed" || booking.status === "rejected") {
        return res.status(400).json({ message: "Cannot cancel a completed or rejected booking." });
      }
    } else if (req.user.role === "provider") {
      // Provider can confirm, reject, or complete booking
      if (Number(booking.provider_id) !== Number(req.user.id)) {
        console.warn(`403 updateBookingStatus: provider_id ${booking.provider_id} != user.id ${req.user.id}`);
        return res.status(403).json({ message: "Access forbidden: you do not provide this service." });
      }
      if (status === "cancelled") {
        return res.status(400).json({ message: "Providers cannot set status to 'cancelled' (use 'rejected' instead)." });
      }
    } else if (req.user.role !== "admin") {
      console.warn(`403 updateBookingStatus: unhandled role ${req.user.role}`);
      return res.status(403).json({ message: "Access denied." });
    }

    // Update status
    const updateQuery = "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *";
    const result = await db.query(updateQuery, [status, id]);

    // Send notification to farmer if provider updated status
    if (req.user.role === "provider") {
      const notifQuery = `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`;
      const notifMessage = `Your booking KS-${id} has been ${status} by the provider.`;
      await db.query(notifQuery, [booking.farmer_id, notifMessage]);
    }

    res.json({
      message: `Booking successfully marked as ${status}.`,
      booking: result.rows[0]
    });

  } catch (error) {
    console.error("Update Booking Status Error:", error);
    res.status(500).json({ message: "Server error updating booking status." });
  }
};

// Rate booking (Farmer only)
const rateBooking = async (req, res) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Please provide a rating between 1 and 5." });
  }

  try {
    const bookingRes = await db.query("SELECT * FROM bookings WHERE id = $1", [id]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const booking = bookingRes.rows[0];
    if (Number(booking.farmer_id) !== Number(req.user.id)) {
      console.warn(`403 rateBooking: farmer_id ${booking.farmer_id} != user.id ${req.user.id}`);
      return res.status(403).json({ message: "Access forbidden: you cannot rate this booking." });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ message: "You can only rate completed bookings." });
    }

    const updateQuery = "UPDATE bookings SET rating = $1, feedback = $2 WHERE id = $3 RETURNING *";
    const result = await db.query(updateQuery, [rating, feedback || "", id]);

    res.json({
      message: "Thank you for your rating and feedback!",
      booking: result.rows[0]
    });

  } catch (error) {
    console.error("Rate Booking Error:", error);
    res.status(500).json({ message: "Server error during rating." });
  }
};

// Update provider location (Provider only)
const updateProviderLocation = async (req, res) => {
  const { id } = req.params;
  const { lat, lng } = req.body;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ message: "Latitude and longitude required." });
  }

  try {
    const updateQuery = "UPDATE bookings SET provider_lat = $1, provider_lng = $2 WHERE id = $3 AND status = 'confirmed' RETURNING *";
    const result = await db.query(updateQuery, [lat, lng, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Active booking not found or not confirmed." });
    }

    res.json({ message: "Location updated", booking: result.rows[0] });
  } catch (error) {
    console.error("Update Location Error:", error);
    res.status(500).json({ message: "Server error updating location." });
  }
};

// Get booking location data (Farmer and Provider)
const getBookingLocation = async (req, res) => {
  const { id } = req.params;
  try {
    const query = "SELECT id, status, farm_lat, farm_lng, provider_lat, provider_lng FROM bookings WHERE id = $1";
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.json({ locationData: result.rows[0] });
  } catch (error) {
    console.error("Get Location Error:", error);
    res.status(500).json({ message: "Server error fetching location." });
  }
};

// Pay for a booking (Farmer only)
const payBooking = async (req, res) => {
  const { id } = req.params;
  const { paymentMethod } = req.body; // 'upi', 'card', 'cod'

  const allowedMethods = ["upi", "card", "cod"];
  if (!allowedMethods.includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method." });
  }

  try {
    // 1. Fetch booking to check ownership & status
    const bookingRes = await db.query(
      "SELECT b.*, s.name as service_name, s.provider_id FROM bookings b JOIN services s ON b.service_id = s.id WHERE b.id = $1",
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const booking = bookingRes.rows[0];

    // Ensure requesting user is the farmer who booked it
    if (Number(booking.farmer_id) !== Number(req.user.id)) {
      console.warn(`403 payBooking: farmer_id ${booking.farmer_id} != user.id ${req.user.id}`);
      return res.status(403).json({ message: "Access forbidden: you do not own this booking." });
    }

    // Only allow paying for bookings that are confirmed or completed
    if (booking.status !== "confirmed" && booking.status !== "completed") {
      return res.status(400).json({ message: "Payment is only accepted for confirmed or completed bookings." });
    }

    if (booking.payment_status === "paid") {
      return res.status(400).json({ message: "This booking has already been paid." });
    }

    // Generate simulated transaction ID
    const transactionId = `KS-PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // 2. Update payment details
    const updateQuery = `
      UPDATE bookings 
      SET payment_status = 'paid', payment_method = $1, payment_transaction_id = $2 
      WHERE id = $3 
      RETURNING *
    `;
    const result = await db.query(updateQuery, [paymentMethod, transactionId, id]);

    // 3. Create notification for provider
    const notifQuery = `
      INSERT INTO notifications (user_id, message) 
      VALUES ($1, $2)
    `;
    const notifMessage = `💰 Payment of ₹${parseFloat(booking.total_price).toFixed(2)} received via ${paymentMethod.toUpperCase()} for booking of ${booking.service_name} (KS-${booking.id}).`;
    await db.query(notifQuery, [booking.provider_id, notifMessage]);

    res.json({
      message: "Payment processed successfully.",
      booking: result.rows[0]
    });

  } catch (error) {
    console.error("Pay Booking Error:", error);
    res.status(500).json({ message: "Server error processing payment." });
  }
};

// Start job timer (Farmer only)
const startTimer = async (req, res) => {
  const { id } = req.params;

  try {
    const bookingRes = await db.query("SELECT * FROM bookings WHERE id = $1", [id]);
    if (bookingRes.rows.length === 0) return res.status(404).json({ message: "Booking not found." });

    const booking = bookingRes.rows[0];

    // Fetch service info to check provider_id
    const serviceRes = await db.query("SELECT provider_id, name FROM services WHERE id = $1", [booking.service_id]);
    const providerId = serviceRes.rows[0]?.provider_id;

    if (Number(booking.farmer_id) !== Number(req.user.id) && Number(providerId) !== Number(req.user.id)) {
      console.warn(`403 startTimer: farmer_id=${booking.farmer_id}, providerId=${providerId}, user.id=${req.user.id}`);
      return res.status(403).json({ message: "Only the farmer or provider assigned to this service can start the work timer." });
    }
    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Work timer can only be started for confirmed bookings." });
    }

    const updateQuery = `
      UPDATE bookings 
      SET start_time = NOW(), timer_status = 'running' 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await db.query(updateQuery, [id]);

    // Notify provider if farmer started timer, or farmer if provider started timer
    if (serviceRes.rows.length > 0) {
      const targetUser = Number(req.user.id) === Number(booking.farmer_id) ? providerId : booking.farmer_id;
      const starterRole = Number(req.user.id) === Number(booking.farmer_id) ? "Farmer" : "Provider";
      const notifMsg = `⏱️ ${starterRole} has started the work timer for booking KS-${id} (${serviceRes.rows[0].name}).`;
      await db.query("INSERT INTO notifications (user_id, message) VALUES ($1, $2)", [targetUser, notifMsg]);
    }

    res.json({ message: "Work timer started successfully.", booking: result.rows[0] });
  } catch (error) {
    console.error("Start Timer Error:", error);
    res.status(500).json({ message: "Server error starting timer." });
  }
};

// Stop job timer & auto-recalculate bill based on actual duration (Farmer only)
const stopTimer = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT b.*, s.price_per_hour, COALESCE(s.pricing_model, 'hourly') as pricing_model, s.provider_id, s.name as service_name 
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.id = $1
    `;
    const bookingRes = await db.query(query, [id]);
    if (bookingRes.rows.length === 0) return res.status(404).json({ message: "Booking not found." });

    const booking = bookingRes.rows[0];

    if (Number(booking.farmer_id) !== Number(req.user.id) && Number(booking.provider_id) !== Number(req.user.id)) {
      console.warn(`403 stopTimer: farmer_id=${booking.farmer_id}, provider_id=${booking.provider_id}, user.id=${req.user.id}`);
      return res.status(403).json({ message: "Only the farmer or provider assigned to this service can stop the work timer." });
    }
    if (booking.timer_status !== "running" || !booking.start_time) {
      return res.status(400).json({ message: "Timer is not currently running for this booking." });
    }

    const startTime = new Date(booking.start_time);
    const stopTime = new Date();
    
    // Calculate actual elapsed hours (minimum 0.1 hr, i.e., 6 mins)
    const elapsedMs = stopTime.getTime() - startTime.getTime();
    let actualHours = parseFloat((elapsedMs / (1000 * 60 * 60)).toFixed(2));
    if (actualHours < 0.1) actualHours = 0.1;

    let finalPrice = parseFloat(booking.total_price);
    // If service is hourly, recalculate bill based on actual elapsed time
    if (booking.pricing_model === "hourly") {
      finalPrice = parseFloat((actualHours * parseFloat(booking.price_per_hour)).toFixed(2));
    }

    const updateQuery = `
      UPDATE bookings 
      SET stop_time = $1, actual_hours = $2, total_price = $3, timer_status = 'stopped', status = 'completed' 
      WHERE id = $4 
      RETURNING *
    `;
    const result = await db.query(updateQuery, [stopTime, actualHours, finalPrice, id]);

    // Send notification to the other party
    const targetUser = Number(req.user.id) === Number(booking.farmer_id) ? booking.provider_id : booking.farmer_id;
    const stopperRole = Number(req.user.id) === Number(booking.farmer_id) ? "Farmer" : "Provider";
    const notifMsg = `🏁 Work completed! ${stopperRole} stopped timer for booking KS-${id}. Actual duration: ${actualHours} hrs. Final Bill: ₹${finalPrice.toLocaleString("en-IN")}.`;
    await db.query("INSERT INTO notifications (user_id, message) VALUES ($1, $2)", [targetUser, notifMsg]);

    res.json({
      message: "Work timer stopped and job marked as completed.",
      actualHours,
      finalPrice,
      booking: result.rows[0]
    });

  } catch (error) {
    console.error("Stop Timer Error:", error);
    res.status(500).json({ message: "Server error stopping timer." });
  }
};

module.exports = {
  createBooking,
  getFarmerBookings,
  getProviderBookings,
  updateBookingStatus,
  rateBooking,
  updateProviderLocation,
  getBookingLocation,
  payBooking,
  startTimer,
  stopTimer
};
