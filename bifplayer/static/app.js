
function BifParser(selected_movie) {
    var that = this;
    this.fileSize = 0;
    this.timeStamp = 0;
    this.frameStartOffset = 0;
    this.frameSize = 0;
    this.dynamicUrl = 'http://' + window.location.hostname + ':' +
        window.location.port + '/api/images/' + selected_movie + '.bif'
    console.log(this.dynamicUrl)

    this.version = 0;
    this.numFrames = 0;
    this.timeStampMultiplier = 0;
    this.bifIndexTableLength = 0;

    this.getFileSize = function () {
        console.log("get filesize for ", this.dynamicUrl);
        var request = jQuery.ajax({
            url: this.dynamicUrl,
            type: 'HEAD',
            success: function () {
                that.fileSize = request.getResponseHeader("Content-Length");
                console.log("filesize is", that.fileSize);
            }
        });
    };
    this.getFileSize();


    this.hexToBase64 = function (str) {
        return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
    };

    this.renderImage = function (header) {
        var img = document.createElement('img');
        img.src = 'data:image/jpeg;base64,' + btoa(that.ab2str(header));
        document.body.appendChild(img);
    };

    this.ab2str = function (buf) {
        return String.fromCharCode.apply(null, buf);
    };

    this.strToByteArray = function (str) {
        var byteArray, i;
        byteArray = new Uint8Array(str.length);
        for (i = 0, strLen = str.length; i < strLen; i++) {
            byteArray[i] = (str.charCodeAt(i) & 0xFF) >>> 0;
        }
        return byteArray;
    };

    this.downloadBinaryData = function (byterange, callback) {
        console.log("downloading", byterange, "in", this.dynamicUrl);
        jQuery.ajax({
            url: this.dynamicUrl,
            type: 'GET',
            dataType: 'binary',
            processData: false,
            headers: {Range: byterange},
            responseType: 'arraybuffer'
        }).done(function (buffer) {
            var outBuffer = new Uint8Array(buffer);
            console.log("downloaded", outBuffer.length, "bytes");
            callback(outBuffer);
        });
    };

    this.downloadString = function (byterange, callback) {
        console.log("downloading", byterange, "in", this.dynamicUrl);
        jQuery.ajax({
            url: this.dynamicUrl,
            type: 'GET',
            dataType: 'text',
            headers: {Range: byterange}
        }).done(function (buffer) {
            console.log("downloaded", buffer.length, "bytes");
            callback(buffer);
        });
    };

    this.scaleNum = function (num, pos) {
        var scaled = (num << (8 * pos)) >>> 0;
        return scaled;
    };

    this.readUint32 = function (bytes, pos) {
        var result = this.scaleNum(bytes[pos], 0) + this.scaleNum(bytes[pos + 1], 1) +
            this.scaleNum(bytes[pos + 2], 2) + this.scaleNum(bytes[pos + 3], 3);
        return result;
    };

    this.parseHeader = function (header) {
        var bifIndexByteRange, oneIndexLen = 8;

        that.version = that.readUint32(header, 8);
        console.log("version", that.version);

        that.numFrames = that.readUint32(header, 12);
        console.log("numFrames", that.numFrames);

        that.timeStampMultiplier = that.readUint32(header, 16);
        console.log("timeStampMultiplier", that.timeStampMultiplier);

        that.bifIndexTableLength = that.numFrames * oneIndexLen;
        console.log("bifIndexTableLength", that.bifIndexTableLength);

        bifIndexByteRange = "bytes=64-" + (64 + that.bifIndexTableLength - 1);
        that.downloadBinaryData(bifIndexByteRange, that.parseIndexTable);
    };

    this.parseIndexTable = function (header) {
        var i = 0, j = 0;

        that.timeStamp = new Uint32Array(that.numFrames);
        that.frameStartOffset = new Uint32Array(that.numFrames);
        that.frameSize = new Uint32Array(that.numFrames);

        that.timeStamp[j] = that.readUint32(header, i) * that.timeStampMultiplier;
        that.frameStartOffset[j] = that.readUint32(header, i + 4);

        i = i + 8; j++;
        for (; i < that.bifIndexTableLength; j++, i = i + 8) {
            that.timeStamp[j] = that.readUint32(header, i) * that.timeStampMultiplier;
            that.frameStartOffset[j] = that.readUint32(header, i + 4);
            that.frameSize[j - 1] = that.frameStartOffset[j] - that.frameStartOffset[j - 1];
            console.log(
                "Frame", j - 1, "timeStamp", that.timeStamp[j - 1],
                "frameStartOffset", that.frameStartOffset[j - 1],
                "frameSize", that.frameSize[j - 1]);
        }
        that.frameSize[j - 1] = that.fileSize - that.frameStartOffset[j - 1];
        console.log(
            "Frame", j - 1, "timeStamp", that.timeStamp[j - 1],
            "frameStartOffset", that.frameStartOffset[j - 1],
            "frameSize", that.frameSize[j - 1]);
    };
}

BifParser.prototype.initHeader = function () {
    var bifHeaderByteRange, bifHeaderLength = 64;
    bifHeaderByteRange = "bytes=0-" + (bifHeaderLength - 1);
    this.downloadBinaryData(bifHeaderByteRange, this.parseHeader);
}


BifParser.prototype.playFile = function () {
    console.log('number of entries in frameStartOffset', this.frameStartOffset.length);
    console.log('number of entries in frameSize', this.frameSize.length);
    var that = this, frameCount = 0;

    _.each(this.frameStartOffset, function (offset) {
        console.log('rendering framenum#', frameCount);
        var frameIndex, frameByteRange;
        frameByteRange = "bytes=" + offset + "-" +
            (offset + that.frameSize[frameCount++] - 1);
        that.downloadBinaryData(frameByteRange, that.renderImage);
    });
}

var bifParserInstance;

function initialize() {
    selected_movie = $('#movie :selected').text();
    console.log(selected_movie);
    bifParserInstance = new BifParser(selected_movie);
    bifParserInstance.initHeader();
}

function play() {
    bifParserInstance.playFile();
}

function redirect() {
    window.location.href = "mailto:satheesh.ram@gmail.com";
}
