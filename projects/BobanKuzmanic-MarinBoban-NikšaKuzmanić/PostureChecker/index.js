let opencvReady = false;

function onOpenCvReady() {
    cv.onRuntimeInitialized = () => {
        console.log('OpenCV.js is ready.');
        opencvReady = true;
        const startBtn = document.getElementById('startBtn');
        if (startBtn) startBtn.disabled = false;
    };
}

let stopTracking = null;

async function startFaceTracking() {
    if (!opencvReady) {
        console.log('OpenCV not ready yet.');
        return;
    }

    const startBtn = document.getElementById('startBtn');
    const spinner = document.getElementById('spinner');
    
    // If already tracking, stop it
    if (stopTracking) {
        stopTracking();
        stopTracking = null;
        startBtn.textContent = 'Start Face Tracking';
        startBtn.classList.remove('btn-danger');
        startBtn.classList.add('btn-success');
        if (spinner) spinner.style.display = 'none';
        return;
    }
    
    if (startBtn) startBtn.disabled = true;
    if (spinner) spinner.style.display = 'inline-block';

    const video = document.getElementById('videoInput');
    let streaming = false;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
        console.log(stream);
        await video.play();
        streaming = true;

    } catch (err) {
        console.log('An error occurred accessing the camera: ', err);
        if (startBtn) startBtn.disabled = false;
        if (spinner) spinner.style.display = 'none';
        return;
    }
    
    // calculate aspect ratio from the intrinsic video size and apply
    // it to the element's width to derive a correct element height
    const aspect = video.videoHeight ? (video.videoWidth / video.videoHeight) : 1;
    video.height = Math.round(video.width / aspect);

    let canvas = document.getElementById('canvasOutput');
    canvas.width = video.width;
    canvas.height = video.height;


    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let dst = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let gray = new cv.Mat();
    let cap = new cv.VideoCapture(video);
    let faces = new cv.RectVector();
    let classifier = new cv.CascadeClassifier();

    // load cascade into Emscripten FS and then load classifier
    try {
        const res = await fetch('openCV/haarcascade_frontalface_default.xml');
        if (!res.ok) throw new Error('Network response was not ok');
        const buf = await res.arrayBuffer();
        try { cv.FS_unlink('haarcascade_frontalface_default.xml'); } catch (e) {}
        cv.FS_createDataFile('/', 'haarcascade_frontalface_default.xml', new Uint8Array(buf), true, false, false);
        classifier.load('haarcascade_frontalface_default.xml');
    } catch (err) {
        console.log('Failed to load cascade:', err);
    }

    const FPS = 30;
    let stopped = false;
    
    // Update button text and style to "Stop"
    startBtn.textContent = 'Stop Face Tracking';
    startBtn.classList.remove('btn-success');
    startBtn.classList.add('btn-danger');
    if (startBtn) startBtn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    
    // Get the threshold slider
    const thresholdSlider = document.getElementById('thresholdSlider');
    const thresholdValue = document.getElementById('thresholdValue');
    
    // Update display when slider changes
    thresholdSlider.addEventListener('change', (e) => {
        thresholdValue.textContent = e.target.value;
    });

    function processVideo() {
        try {
            if (!streaming || stopped) {
                // clean and stop.
                src.delete();
                dst.delete();
                gray.delete();
                faces.delete();
                classifier.delete();
                return;
            }
            let begin = Date.now();
            // start processing.
            cap.read(src);
            src.copyTo(dst);
            cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);
            // detect faces.
            classifier.detectMultiScale(gray, faces, 1.1, 3, 0);
            
            // Get current threshold from slider
            const currentThreshold = parseInt(thresholdSlider.value);
            
            // draw threshold line
            const lineY = currentThreshold;
            const point1 = new cv.Point(0, lineY);
            const point2 = new cv.Point(video.width, lineY);
            cv.line(dst, point1, point2, [0, 255, 0, 255], 2);
            
            // draw faces.
            let badPostureDetected = false;
            for (let i = 0; i < faces.size(); ++i) {
                let face = faces.get(i);
                let point1 = new cv.Point(face.x, face.y);
                let point2 = new cv.Point(face.x + face.width, face.y + face.height);
                cv.rectangle(dst, point1, point2, [255, 0, 0, 255]);
                // Only play sound if face.y is above threshold
                if(face.y > currentThreshold){
                    document.getElementById("beepSound").play();
                    badPostureDetected = true;
                }
            }
            
            // Show or hide the posture alert
            const postureAlert = document.getElementById('postureAlert');
            if (badPostureDetected) {
                postureAlert.style.display = 'block';
                postureAlert.classList.add('show');
            } else {
                postureAlert.style.display = 'none';
                postureAlert.classList.remove('show');
            }
            
            cv.imshow('canvasOutput', dst);
            
            // schedule the next one.
            let delay = 1000/FPS - (Date.now() - begin);
            setTimeout(processVideo, delay);
        } catch (err) {
            console.log(err);
        }
    }
    
    processVideo();

    // expose a stop method
    stopTracking = () => { 
        stopped = true;
        streaming = false;
    };
}

// Service worker disabled for development
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/sw.js')
//             .then(reg => console.log('Service worker registered.', reg))
//             .catch(err => console.log('Service worker registration failed:', err));
//     });
// }

// wire up Start button (DOM is already loaded because script is at page end)
const __startBtn = document.getElementById('startBtn');
if (__startBtn) __startBtn.addEventListener('click', startFaceTracking);

// Optionally enable landing Try it button to focus the start button after navigation
const __landingTry = document.getElementById('landingTry');
if (__landingTry) __landingTry.addEventListener('click', () => {
    setTimeout(() => { const sb = document.getElementById('startBtn'); if (sb) sb.focus(); }, 200);
});

let last = performance.now();
setInterval(() => {
  const now = performance.now();
  /*console.log("Delay:", Math.round(now - last) + "ms");*/
  last = now;
}, 100);