const video = document.getElementById('video');
const startbtn = document.getElementById('startbtn');
const canvas = document.getElementById('canvas');

const API_URL = 'https://f2234eb74941.ngrok-free.app/api/v1/analyze/';
const captureInterval = 30000; // Capture every 10 seconds

let stream;
let intervalID;
const locationLabel = "Main Gate"; // Customize this label
const org_id = "690fa7e0cddc17edfa7d5259"; // Example organization ID

// ===============================
// Start camera feed
// ===============================
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480,
        facingMode: { ideal: "environment" }
      },
      audio: false
    });
    video.srcObject = stream;
  } catch (error) {
    console.error("Camera permission denied or not available:", error.message);
  }
}

// ===============================
// Get current time for filenames and logs
// ===============================
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString("en-GB", { hour12: true });
}

// ===============================
// Capture a frame and send to backend
// ===============================
function captureFrame() {
  if (!video.videoWidth) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(async (blob) => {
    if (!blob) {
      console.error("Failed to capture frame blob");
      return;
    }

    const formData = new FormData();
    const safeTime = getCurrentTime().replace(/:/g, "-");
    formData.append('image', blob, `capture_${safeTime}.jpeg`);
    formData.append('location', locationLabel);
    formData.append('org_id', org_id);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        mode: 'cors',              // ensures CORS request
        cache: 'no-store',         // prevents caching
        redirect: 'follow',        // allow redirects if any
        headers: {
          'Accept': 'application/json', // optional for backend clarity
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log("Image uploaded successfully at:", getCurrentTime());
    } catch (error) {
      console.error("Error uploading image:", error.message);
    }
  }, 'image/png', 0.7);
}

// ===============================
// Start/Stop capturing loop
// ===============================
startbtn.addEventListener('click', async () => {
  if (!stream) await startCamera();

  if (intervalID) {
    clearInterval(intervalID);
    intervalID = null;
    startbtn.textContent = "Start Capturing";
    console.log("Capture stopped.");
  } else {
    captureFrame(); // Capture immediately
    intervalID = setInterval(captureFrame, captureInterval);
    startbtn.textContent = "Stop Capturing";
    console.log("Capture started. Uploading every 30 seconds.");
  }
});
