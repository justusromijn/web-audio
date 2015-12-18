var audioCtx;
var analyser;
var bufferLength;
var sampleRate;
var dataArray;
var source;
var audio = document.querySelector('audio#mic-audio');
var canvas = document.querySelector('canvas#visual');
var canvasCtx = canvas.getContext('2d');
var WIDTH = canvas.width = 600;
var HEIGHT = canvas.height = 400;
var notes = [
  { name: 'C', frequencies: [16.35, 32.70, 65.41, 130.81, 261.63, 523.25, 1046.50, 2093.00, 4186.01] },
  { name: 'C#/Db', frequencies: [17.32, 34.65, 69.30, 138.59, 277.18, 554.37, 1108.73, 2217.46, 4434.92] },
  { name: 'D', frequencies: [18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32, 4698.63] },
  { name: 'D#/Eb', frequencies: [19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02, 4978.03] },
  { name: 'E', frequencies: [20.60, 41.20, 82.41, 164.81, 329.63, 659.25, 1318.51, 2637.02, 5274.04] },
  { name: 'F', frequencies: [21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83, 5587.65] },
  { name: 'F#/Gb', frequencies: [23.12, 46.25, 92.50, 185.00, 369.99, 739.99, 1479.98, 2959.96, 5919.91] },
  { name: 'G', frequencies: [24.50, 49.00, 98.00, 196.00, 392.00, 783.99, 1567.98, 3135.96, 6271.93] },
  { name: 'G#/Ab', frequencies: [25.96, 51.91, 103.83, 207.65, 415.30, 830.61, 1661.22, 3322.44, 6644.88] },
  { name: 'A', frequencies: [27.50, 55.00, 110.00, 220.00, 440.00, 880.00, 1760.00, 3520.00, 7040.00] },
  { name: 'A#/Bb', frequencies: [29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31, 7458.62] },
  { name: 'B', frequencies: [30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07, 7902.13] }
];

navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

if ((!navigator.getUserMedia) && navigator.MediaDevices){
  navigator.getUserMedia = navigator.MediaDevices.getUserMedia;
}

if(navigator.getUserMedia){

  navigator.getUserMedia({ audio: true }, resolved, rejected);
}

function rejected(){
  console.log('%c not streaming...', 'background: #900; color: #fff');
}

function resolved(stream){
  console.log('%cstreaming...', 'background: #bada55; color: #222');
  var audio = document.querySelector('audio');
  audio.src = window.URL.createObjectURL(stream);
  console.log(audio.src);

  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioCtx = new AudioContext();
  source = audioCtx.createMediaStreamSource(stream);

  audio.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
  sampleRate = audioCtx.sampleRate;
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  bufferLength = analyser.frequencyBinCount;
  analyser.smoothingTimeConstant = 0; // for snapshots

    source.connect(analyser);


  dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  (function getData(){
    analyser.getByteFrequencyData(dataArray);
    console.log(dataArray[300],dataArray[400],dataArray[500]);
    setTimeout(function(){
      getData();
      takeBufferSnapshot();
    }, 1000);
  })();

}

function takeBufferSnapshot() {
  dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  var total = 0;
  var highest = 0;
  for (var i=0;i<dataArray.length;i++){
    if (dataArray[i] > highest){
      highest = dataArray[i];
    }
  }
  console.log('total: ', total);
  console.log('highest: ', highest);
  console.log('samplerate:' , sampleRate);


  var x = numeric.linspace(0, sampleRate, bufferLength);
  var normalArray = Array.from(dataArray);
  var s = numeric.spline(x, normalArray);


  function drawAudio(){
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    var barWidth = (WIDTH / bufferLength) * 2.5;
    var barHeight;
    var x = 0;

    for(var i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];

      canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
      canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);

      x += barWidth + 1;
    }
  }
  drawAudio();
  var snapshotScore = {};

  notes.forEach(function (note) {
    snapshotScore[note.name] = 0;
    note.frequencies.forEach(function (frequency) {
      var interpolatedValue = s.at(frequency);
      if (interpolatedValue > (highest * 0.8)){
        snapshotScore[note.name] += interpolatedValue;
      }
      //console.log(note.name + ', ' + frequency + ', ' + s.at(frequency));
    });
  });

  console.log('snapshotScores: ', snapshotScore);
}