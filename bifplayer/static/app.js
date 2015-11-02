// wrappers for calling from html
var bifParserInstance;

function initialize() {
    selectedMovie = $('#movie :selected').text();
    console.log(selectedMovie);
    bifParserInstance = new BifParser(selectedMovie);
    bifParserInstance.initHeader();
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

function play() {
    //bifParserInstance.playFile();
    for (var i = 0; i <  bifParserInstance.numFrames; i++) {
        bifParserInstance.loadFrame(i, renderImage);
    }
}

function redirect() {
    window.location.href = "mailto:satheesh.ram@gmail.com";
}
