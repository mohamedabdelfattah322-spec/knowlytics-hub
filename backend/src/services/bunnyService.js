const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_TOKEN_KEY = process.env.BUNNY_TOKEN_KEY;
const BUNNY_API_URL = process.env.BUNNY_API_URL || 'https://video.bunnycdn.com';

const bunnyClient = axios.create({
  baseURL: `${BUNNY_API_URL}/library/${BUNNY_LIBRARY_ID}`,
  headers: {
    'AccessKey': BUNNY_API_KEY,
  },
});

/**
 * Upload a video file to Bunny.net
 * Returns: { videoId, title, guid }
 */
const uploadVideoToBunny = async (filePath, title) => {
  try {
    if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
      throw new Error('Bunny credentials not configured');
    }

    // Step 1: Create a video entry in Bunny
    const videoTitle = title || path.basename(filePath);
    const createRes = await bunnyClient.post('/videos', {
      title: videoTitle,
    });

    const videoId = createRes.data.videoId;
    const guid = createRes.data.guid;

    // Step 2: Upload the actual video file
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;

    await bunnyClient.put(`/videos/${videoId}`, fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileSize,
      },
    });

    console.log(`[Bunny] Uploaded: ${videoTitle} (ID: ${videoId}, Size: ${fileSize} bytes)`);

    return { videoId, guid, title: createRes.data.title };
  } catch (err) {
    console.error('[Bunny Upload Error]', err.response?.data || err.message);
    throw new Error(`Failed to upload to Bunny: ${err.message}`);
  }
};

/**
 * Generate a signed embed URL (expires in 4 hours)
 * Token = SHA256(TOKEN_KEY + VIDEO_ID + EXPIRES)
 */
const getSignedEmbedUrl = (videoId, expiresInSeconds = 14400) => {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;

  if (!BUNNY_TOKEN_KEY) {
    // No token key — return unsigned URL
    return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?autoplay=false`;
  }

  // Bunny token = SHA256(token_key + video_id + expires)
  const hash = crypto
    .createHash('sha256')
    .update(BUNNY_TOKEN_KEY + videoId + expires)
    .digest('hex');

  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?token=${hash}&expires=${expires}&autoplay=false`;
};

/**
 * Get static embed URL (no token — used when storing in DB)
 */
const getEmbedUrl = (videoId) => {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}`;
};

/**
 * Get video info from Bunny (including duration in seconds)
 * Retries up to maxAttempts times (Bunny needs time to process)
 */
const getVideoDuration = async (videoId, maxAttempts = 10, delayMs = 3000) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await bunnyClient.get(`/videos/${videoId}`);
      const duration = res.data.length; // duration in seconds
      if (duration && duration > 0) {
        console.log(`[Bunny] Video ${videoId} duration: ${duration}s`);
        return duration;
      }
      // Video still processing — wait and retry
      console.log(`[Bunny] Waiting for video processing... attempt ${i + 1}/${maxAttempts}`);
      await new Promise((r) => setTimeout(r, delayMs));
    } catch (err) {
      console.error(`[Bunny] getVideoDuration error:`, err.message);
    }
  }
  return null; // couldn't get duration
};

/**
 * Delete video from Bunny
 */
const deleteVideoFromBunny = async (videoId) => {
  try {
    await bunnyClient.delete(`/videos/${videoId}`);
    console.log(`[Bunny] Deleted video: ${videoId}`);
  } catch (err) {
    console.error('[Bunny Delete Error]', err.message);
  }
};

module.exports = {
  uploadVideoToBunny,
  getEmbedUrl,
  getSignedEmbedUrl,
  getVideoDuration,
  deleteVideoFromBunny,
};
