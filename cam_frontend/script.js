const video = document.getElementById('video')
const startbtn = document.getElementById('startbtn')
const canvas = document.getElementById('canvas')

const API_URL = ''
const capture = 10000

let stream
let intervalID

async function startCamera(){
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480,
                facingMode: {ideal: "environment"}
            },
            audio: false
        })

        video.srcObject = stream
    } catch (error) {
        console.error("Camera permission denied or not available: " + error.message)
    }
}

function getCurrentTime(){
    const now = new Date()
    const timestring = now.toLocaleTimeString("en-GB", { hour12: true})
    return timestring
}

function captureFrame(){
    if(!video.videoWidth) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
        const formData = new FormData()
        const safeTime = getCurrentTime().replace(/:/g, "-");
        formData.append('image', blob, `capture_${safeTime}.png`)

        fetch(API_URL, {
            method: 'POST',
            body: formData
        })
        .then(() => {
            console.log("Image uploaded successfully", getCurrentTime())
        })
        .catch(error => {
            console.error("Error uploading image:", error)
        })
    }, 'image/png', 0.7)
}

startbtn.addEventListener('click', async () => {
    if(!stream) await startCamera()

    if(intervalID){
        clearInterval(intervalID)
        intervalID = null
        startbtn.textContent = "Start Capturing"
    }else{
        captureFrame()
        intervalID = setInterval(captureFrame, capture)
        startbtn.textContent = "Stop Capturing"
    }
})