const jwt = require("jsonwebtoken"); 
const pool = require("../config/dbconfig");
const { haversineDistance } = require("../utils/location");

module.exports = (io, logger) => {
  // Optional: Attach authentication middleware before this


  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));

      // ✅ Verify token and attach user
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Adjust secret
      socket.user = { id: decoded.id }; // You can attach more user info if needed
      next();
    } catch (err) {
      console.error("❌ Socket auth failed:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    if (!userId) {
      console.warn("⚠️ Unauthorized socket. Disconnecting...");
      return socket.disconnect();
    }
    console.log(`✅ New socket connection: ${socket.id}`);

    // Join user-specific room
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`👥 Socket joined room: user_${userId}`);
    }

    // 🔍 QR Scan Handler
    socket.on("scan_qr", async ({ targetUserId, latitude, longitude }) => {
      console.log(`📍 scan_qr event from user ${userId} scanning ${targetUserId}`);

      if (!targetUserId || targetUserId === userId) {
        console.warn(`⚠️ Invalid or self-scan`);
        return;
      }

      try {
        // 1. Get or create connection
        const connRes = await pool.query(
          `
          SELECT * FROM userconnections
          WHERE (user1_id = $1 AND user2_id = $2)
             OR (user1_id = $2 AND user2_id = $1)
          `,
          [userId, targetUserId]
        );

        if (connRes.rowCount === 0) {
          console.log(`➕ Creating new connection`);
          await pool.query(
            `
            INSERT INTO userconnections (user1_id, user2_id, status, created_at)
            VALUES ($1, $2, 'approved', NOW())
            `,
            [userId, targetUserId]
          );
        } else if (connRes.rows[0].status === "pending") {
          console.log(`🟡 Approving pending connection`);
          await pool.query(
            `UPDATE userconnections SET status = 'approved' WHERE id = $1`,
            [connRes.rows[0].id]
          );
        } else {
          console.log(`✅ Connection exists: ${connRes.rows[0].status}`);
        }

        // 2. Fetch mutual ongoing events
        const eventRes = await pool.query(
          `
          SELECT e.* FROM events e
          JOIN eventregistrations r1 ON e.id = r1.event_id AND r1.user_id = $1
          JOIN eventregistrations r2 ON e.id = r2.event_id AND r2.user_id = $2
          WHERE e.start_date_time <= NOW() AND e.end_date_time >= NOW()
          `,
          [userId, targetUserId]
        );

        if (eventRes.rowCount === 0) {
          console.warn("⚠️ No mutual ongoing events found");
          return socket.emit("meeting_error", {
            message: "No mutual ongoing event.",
          });
        }

        // 3. Get distance settings
        const settingsRes = await pool.query(
          `SELECT check_in_distance FROM settings LIMIT 1`
        );
        const maxDistance = settingsRes.rows[0]?.check_in_distance || 100;

        // 4. Find closest mutual event within range
        let matchedEvent = null;
        for (const event of eventRes.rows) {
          const distance = haversineDistance(
            latitude,
            longitude,
            event.latitude,
            event.longitude
          );

          console.log(`📍 Event "${event.name}" → Distance: ${distance}m (Allowed: ${maxDistance})`);

          if (distance <= maxDistance) {
            matchedEvent = event;
            break;
          }
        }

        if (!matchedEvent) {
          console.warn("🚫 Too far from all mutual events");
          return socket.emit("meeting_error", {
            message: "You're too far from the event.",
          });
        }

        // 5. Emit meeting request to the scanned user
        console.log(`📨 Sending meeting_request to user_${targetUserId}`);
        io.to(`user_${targetUserId}`).emit("meeting_request", {
          fromUserId: userId,
          eventId: matchedEvent.id,
        });
      } catch (err) {
        logger?.error?.("❌ Error in scan_qr:", err);
        console.error("❌ scan_qr failed:", err);
        socket.emit("meeting_error", { message: "Server error." });
      }
    });

    // ✅ Response to Meeting Request
    socket.on("respond_meeting_request", async ({ eventId, fromUserId, accept }) => {
        const userId = socket.user?.id; // This is the current socket's user, the one responding
      console.log(
        `📨 respond_meeting_request from ${fromUserId} → ${userId}, accepted: ${accept}`
      );

      if (!accept) {
        console.log(`❌ Meeting request declined by ${userId}`);
        return io.to(`user_${fromUserId}`).emit("meeting_declined", { by: userId });
      }

      try {
        // Ensure lowest userId is always user1 for uniqueness
        const [user1, user2] = [userId, fromUserId].sort((a, b) => a - b);

        const result = await pool.query(
          `
          INSERT INTO event_meetings (event_id, user1_id, user2_id, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING id
          `,
          [eventId, user1, user2]
        );

        const meetingId = result.rows[0].id;
        console.log(`📝 Meeting created with ID: ${meetingId}`);

        io.to(`user_${userId}`).emit("write_meeting_notes", { meetingId });
        io.to(`user_${fromUserId}`).emit("write_meeting_notes", { meetingId });
      } catch (err) {
        logger?.error?.("❌ Error in respond_meeting_request:", err);
        console.error("❌ respond_meeting_request failed:", err);
        socket.emit("meeting_error", {
          message: "Failed to create meeting.",
        });
      }
    });
  });
};
