function BifParser(selectedMovie) {
    // private variable
    var that = this;

    //instance variables
    this.fileSize = 0;
    this.timeStamp = 0;
    this.frameStartOffset = 0;
    this.frameSize = 0;
    this.dynamicUrl = 'http://' + window.location.hostname + ':' +
        window.location.port + '/api/images/' + selectedMovie + '.bif'
    console.log(this.dynamicUrl)
    this.version = 0;
    this.numFrames = 0;
    this.timeStampMultiplier = 0;
    this.bifIndexTableLength = 0;

    //--------- private members ------------------

    //gets the size of online resource from its metadata
    function getFileSize() {
        console.log("get filesize for ", that.dynamicUrl);
        var request = jQuery.ajax({
            url: that.dynamicUrl,
            type: 'HEAD',
            success: function () {
                that.fileSize = request.getResponseHeader("Content-Length");
                console.log("filesize is", that.fileSize);
            }
        });
    };

    // scale the given unsigned number, according to byte pos
    function scaleNum(num, pos) {
        var scaled = (num << (8 * pos)) >>> 0;
        return scaled;
    };

    //read unsigned int from binary array
    function readUint32(bytes, pos) {
        var result = scaleNum(bytes[pos], 0) + scaleNum(bytes[pos + 1], 1) +
            scaleNum(bytes[pos + 2], 2) + scaleNum(bytes[pos + 3], 3);
        return result;
    };

    //--------- privileged members ------------------
    //ajax wrapper
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

    //parse BIF frame header
    this.parseHeader = function (header) {
        var bifIndexByteRange, oneIndexLen = 8;

        that.version = readUint32(header, 8);
        console.log("version", that.version);

        that.numFrames = readUint32(header, 12);
        console.log("numFrames", that.numFrames);

        that.timeStampMultiplier = readUint32(header, 16);
        console.log("timeStampMultiplier", that.timeStampMultiplier);

        that.bifIndexTableLength = that.numFrames * oneIndexLen;
        console.log("bifIndexTableLength", that.bifIndexTableLength);

        bifIndexByteRange = "bytes=64-" + (64 + that.bifIndexTableLength - 1);
        that.downloadBinaryData(bifIndexByteRange, that.parseIndexTable);
    };

    //parse BIF Index table
    this.parseIndexTable = function (header) {
        var i = 0, j = 0;

        that.timeStamp = new Uint32Array(that.numFrames);
        that.frameStartOffset = new Uint32Array(that.numFrames);
        that.frameSize = new Uint32Array(that.numFrames);

        that.timeStamp[j] = readUint32(header, i) * that.timeStampMultiplier;
        that.frameStartOffset[j] = readUint32(header, i + 4);

        i = i + 8; j++;
        for (; i < that.bifIndexTableLength; j++, i = i + 8) {
            that.timeStamp[j] = readUint32(header, i) * that.timeStampMultiplier;
            that.frameStartOffset[j] = readUint32(header, i + 4);
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

    getFileSize();

    // deprecate privileged member
    this.playFile = function () {
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
}

//public member
BifParser.prototype.initHeader = function () {
    var bifHeaderByteRange, bifHeaderLength = 64;
    bifHeaderByteRange = "bytes=0-" + (bifHeaderLength - 1);
    this.downloadBinaryData(bifHeaderByteRange, this.parseHeader);
}

//public member
BifParser.prototype.loadFrame = function (frameNum, callback) {
    console.log('rendering framenum #', frameNum);
    var frameByteRange = "bytes=" +
        this.frameStartOffset[frameNum] + "-" +
        (this.frameStartOffset[frameNum] + this.frameSize[frameNum] - 1);
    this.downloadBinaryData(frameByteRange, callback);
}
