const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
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

    console.log(`[Bunny] Uploaded video: ${videoTitle} (ID: ${videoId}, Size: ${fileSize} bytes)`);

    return {
      videoId,
      guid,
      title: createRes.data.title,
    };
  } catch (err) {
    console.error('[Bunny Upload Error]', err.response?.data || err.message);
    throw new Error(`Failed to upload to Bunny: ${err.message}`);
  }
};

/**
 * Get Bunny video embed URL
 */
const getEmbedUrl = (videoId) => {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}`;
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
  deleteVideoFromBunny,
};
