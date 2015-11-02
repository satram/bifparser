// wrappers for calling from html
var bifParserInstance;

function initialize() {
    selectedMovie = $('#movie :selected').text();
    console.log(selectedMovie);
    dynamicUrl = 'http://' + window.location.hostname + ':' +
        window.location.port + '/api/images/' + selectedMovie + '.bif'
    console.log(this.dynamicUrl)

    bifParserInstance = new BifParser(dynamicUrl);
    bifParserInstance.initHeader(onInitHeaderComplete);
}

function onInitHeaderComplete(bifObject) {
    console.log('bif header has been initialized');
    console.log('start preloading in app....');
}

function play() {
    //bifParserInstance.playFile();
    for (var i = 0; i <  bifParserInstance.numFrames; i++) {
        bifParserInstance.loadFrame(i, renderImage);
    }
}

//convert array buffer to string
function ab2str(buf) {
    return String.fromCharCode.apply(null, buf);
}

// display the given binary data in html
function renderImage(imageBuffer) {
    var img = document.createElement('img');
    img.src = 'data:image/jpeg;base64,' + btoa(ab2str(imageBuffer));
    document.body.appendChild(img);
}

function redirect() {
    window.location.href = "mailto:satheesh.ram@gmail.com";
}
