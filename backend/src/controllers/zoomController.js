const axios = require('axios');
const { query } = require('../config/database');

// Get Zoom OAuth token using Server-to-Server OAuth
const getZoomToken = async () => {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {},
    { headers: { Authorization: `Basic ${credentials}` } }
  );
  return response.data.access_token;
};

// POST /api/zoom/meetings  — create a Zoom meeting for a live course
const createMeeting = async (req, res, next) => {
  try {
    const { course_id, topic, start_time, duration } = req.body;
    const token = await getZoomToken();

    const meetingResponse = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic,
        type: 2, // Scheduled
        start_time,
        duration,
        settings: {
          auto_recording: 'cloud', // Auto-save recordings to Zoom cloud
          waiting_room: true,
          join_before_host: false,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const meeting = meetingResponse.data;

    // Persist in DB
    const result = await query(
      `INSERT INTO zoom_meetings (course_id, zoom_meeting_id, join_url, start_url, topic, start_time, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [course_id, String(meeting.id), meeting.join_url, meeting.start_url, topic, start_time, duration]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/zoom/meetings/course/:courseId  — list meetings for a course
const listMeetings = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM zoom_meetings WHERE course_id = $1 ORDER BY start_time DESC`,
      [req.params.courseId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/zoom/webhook  — Zoom sends recording-ready event
const zoomWebhook = async (req, res) => {
  const event = req.body;

  // Validate Zoom webhook signature (simplified — add proper HMAC check in production)
  if (event.event === 'recording.completed') {
    const meetingId = String(event.payload.object.id);
    const recordingFiles = event.payload.object.recording_files || [];

    const mp4File = recordingFiles.find((f) => f.file_type === 'MP4');
    if (mp4File) {
      await query(
        `UPDATE zoom_meetings SET recording_url = $1, recording_ready = true WHERE zoom_meeting_id = $2`,
        [mp4File.download_url, meetingId]
      ).catch(console.error);
    }
  }

  res.status(200).json({ message: 'OK' });
};

module.exports = { createMeeting, listMeetings, zoomWebhook };
