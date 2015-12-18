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
    spline;

  function init(){

    return new Promise(function(resolve, reject){
      if (UserMedia){
        UserMedia.call(navigator, { audio: true }, function(stream){
            source = context.createMediaStreamSource(stream);
            analyser = context.createAnalyser();
            analyser.smoothingTimeConstant = 0;
            source.connect(analyser);
            linearSpace = numeric.linspace(0, context.sampleRate, analyser.frequencyBinCount);

            resolve({ getNotes: getNotes });
          },
        function(){
          reject('No audio input.');
        });
      }
    });
  }

  function getNotes(){
    interpolatedValues = {};
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    var normalArray = Array.from(dataArray);
    spline = numeric.spline(linearSpace, normalArray);
    Object.keys(GUITAR_STRINGS).forEach(function(note){
      interpolatedValues[note] = interpolatedValues[note] || 0;
      interpolatedValues[note] += spline.at(GUITAR_STRINGS[note]);
    });

  //console.log(interpolatedValues);
  drawAudio();
      drawZoomed();
      setTimeout(function(){
          getNotes();
          drawZoomed();
      });
  }

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