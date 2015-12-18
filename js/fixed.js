(function(window, numeric){
  // use supported implementation

  var UserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia,

    AudioContext = window.AudioContext || window.webkitAudioContext,
    audio = document.querySelector('audio#mic-audio'),
    canvas = document.querySelector('canvas#visual'),
    canvasCtx = canvas.getContext('2d'),
    zoomed = document.querySelector('canvas#zoomed'),
    zoomedCtx = zoomed.getContext('2d'),
    context = new AudioContext(),
    WIDTH = canvas.width = zoomed.width = 600,
    HEIGHT = canvas.height = zoomed.height = 400,

    NOTES = [
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
    ],
    timeout,

    GUITAR_STRINGS = {
      'E2': 82.41,
      'A2': 110.00,
      'D3': 146.83,
      'G3': 196.00,
      'B3': 246.94,
      'E4': 329.63
    },
    source,
    analyser,
    dataArray,
    linearSpace,
    count = 0,
    interpolatedValues = {},
      addedValues = {},
    interpolationHistory = [],
    spline;

  function init(){

    return new Promise(function(resolve, reject){
      if (UserMedia){
        UserMedia.call(navigator, { audio: true }, function(stream){
            source = context.createMediaStreamSource(stream);
            analyser = context.createAnalyser();
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            linearSpace = numeric.linspace(0, context.sampleRate, analyser.frequencyBinCount);

            resolve({ getNotes: getNotes, takeSnapshot: takeSnapshot });
          },
        function(){
          reject('No audio input.');
        });
      }
    });
  }
    function takeSnapshot(){
        console.log(addedValues);
    }

    function getNotes(){
    interpolatedValues = {};var highestProp;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    var normalArray = Array.from(dataArray);
    spline = numeric.spline(linearSpace, normalArray);
      NOTES.forEach(function(note){
        interpolatedValues[note.name] = interpolatedValues[note.name] || 0;
        note.frequencies.forEach(function(freq){
            interpolatedValues[note.name] += spline.at(freq);
        });
      });
        interpolationHistory.push(interpolatedValues);
        if (interpolationHistory.length > 40){
            interpolationHistory.shift();
        }

        addedValues = {};

        interpolationHistory.forEach(function(interpolationValues){
            for(var prop in interpolationValues) {
                addedValues[prop] = addedValues[prop] || 0;
                addedValues[prop] += interpolationValues[prop];
            }
        });
        highestProp = { value: 0, name: ''};

        for (var prop in addedValues){
            if (addedValues[prop] > highestProp.value){
                highestProp.name = prop;
                highestProp.value = addedValues[prop];
            }
        }

        document.querySelector('#note').innerText = highestProp.name;

      drawAudio();
      drawZoomed();


      setTimeout(function(){
          getNotes();
      },1);
    };

  window.NoteDetect = {
    init: init,
    getNotes: getNotes
  };
  init();

    function drawAudio(){

        // all raw data
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        var barWidth = (WIDTH / analyser.frequencyBinCount) * 2;
        var barHeight;
        var x = 0;
        var color;

        for(var i = 0; i < analyser.frequencyBinCount; i++) {
            barHeight = dataArray[i];
            //debugger;
            if ((i * (context.sampleRate / analyser.frequencyBinCount)) > 600 &&
                (i * (context.sampleRate /analyser.frequencyBinCount)) < 1000 ){
                color = 'rgb(50,50,150)';
            } else {
                color = 'rgb(150,50,50)';
            }

            canvasCtx.fillStyle = color;
            canvasCtx.fillRect(x,HEIGHT-barHeight,barWidth,barHeight);

            x += barWidth + 1;
        }
    }
    function drawZoomed(){
        zoomedCtx.clearRect(0, 0, WIDTH, HEIGHT);
        zoomedCtx.fillStyle = 'rgb(0, 0, 0)';
        zoomedCtx.fillRect(0, 0, WIDTH, HEIGHT);

        var barWidth = (WIDTH / 80);
        var barHeight;
        var x = 0;
        var color;

        for(var i = 0; i < 80; i++) {
            barHeight = spline.at(600 + (i * 5));
            if ((i * 5) === 60){
                color = 'rgb(50,50,150)';
            } else {
                color = 'rgb(150,50,50)';
            }

            zoomedCtx.fillStyle = color;
            zoomedCtx.fillRect(x,HEIGHT-barHeight,barWidth,barHeight);
            x += barWidth;


        }
    }


})(window, numeric);