var video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');
const frm = 'http://192.168.3.116:8000/tfjs/model.json';
var model = undefined;

// Check if webcam access is supported.
function getUserMediaSupported() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it to call enableCam function which we will 
// define in the next step.
if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

async function loadModel() {
// Pretend model has loaded so we can try out the webcam code.
// var model = true;
// demosSection.classList.remove('invisible');
  model = await tf.loadLayersModel(frm)
  console.log("MODEL LOADED")
  demosSection.classList.remove('invisible');
}

loadModel();

function enableCam(event) {
  // Only continue if the model has finished loading.
  if (!model) {
    return;
  }

  // Hide the button once clicked.
  event.target.classList.add('removed');

  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: { width: 260, height: 260 }
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video.srcObject = stream;
    video.addEventListener('loadeddata', predictWebcam);
  });
}

var children = [];

function predictWebcam() {
  // Now let's start classifying a frame in the stream.
  if (!(video instanceof tf.Tensor)) {
    console.log("TENSOR!");
    // video = tf.browser.fromPixels(video);
    // video.shape.unshift(null) ;
    console.log("VIDEO", video)

    var photo;
    
    function takepicture() {
      var canvas = new OffscreenCanvas(260, 260)
      var context = canvas.getContext('2d');
        // canvas.width = 260;
        // canvas.height = 260;
        // context.drawImage(video, 0, 0, 260, 260);
        
        photo = canvas.transferToImageBitmap();
      photo = tf.browser.fromPixels(photo);
      photo.shape.unshift(null) ;
        // var data = canvas.toDataURL('image/png');
        // photo.setAttribute('src', data);
    }
  }

  takepicture();
  console.log("PHOTO", photo)
  
  model.predict(photo).then(function (predictions) {
    // Remove any highlighting we did previous frame.
    for (let i = 0; i < children.length; i++) {
      liveView.removeChild(children[i]);
    }
    children.splice(0);

    console.log("PREDICTIONS", predictions);
    // Now lets loop through predictions and draw them to the live view if
    // they have a high confidence score.
    for (let n = 0; n < predictions.length; n++) {
      // If we are over 66% sure we are sure we classified it right, draw it!
      if (predictions[n].score > 0.66) {
        const p = document.createElement('p');
        p.innerText = predictions[n].class + ' - with '
          + Math.round(parseFloat(predictions[n].score) * 100)
          + '% confidence.';
        p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: '
          + (predictions[n].bbox[1] - 10) + 'px; width: '
          + (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';

        const highlighter = document.createElement('div');
        highlighter.setAttribute('class', 'highlighter');
        highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
          + predictions[n].bbox[1] + 'px; width: '
          + predictions[n].bbox[2] + 'px; height: '
          + predictions[n].bbox[3] + 'px;';

        liveView.appendChild(highlighter);
        liveView.appendChild(p);
        children.push(highlighter);
        children.push(p);
      }
    }

    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);
  });
}
