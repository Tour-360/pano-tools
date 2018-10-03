#target photoshop

var tempDir = $.getenv('TMPDIR') ||  $.getenv('TEMP');
ptFile = new File(tempDir+'pano-tools');
ptFile.open();
var options = {};
var ptOptions = ptFile.read().split('\n');
for (var i = 0; i < ptOptions.length; i++ ) {
 values = ptOptions[i].split(/\s/)
 options[values[0]] = values[1];
}


// =============






var dir = Folder(options.panoImport);
var files = dir.getFiles(/\.(tif|)$/i);
for(var i = 0; i < files.length; i++){
  var rawFile = new File(files[i]);
  var fileName = files[i].fsName.split('/').pop().split('.')[0];
  var newFile = new File(options.panoExport+"/"+fileName+'.tif');

  if(!newFile.exists) {
    // var docRef = app.documents.add('7284px', '3642px', 300, "file", NewDocumentMode.RGB , undefined, undefined, BitsPerChannelType.SIXTEEN);
    // placeFile( rawFile );

    var doc = open(rawFile);
    doc.convertProfile("sRGB IEC61966-2.1", Intent.PERCEPTUAL, true, false, Dither.NONE);
    SaveJPEG(doc, newFile);
    doc.close(SaveOptions.DONOTSAVECHANGES);
  }
}

executeAction(app.charIDToTypeID('quit'), undefined, DialogModes.NO);

// =======

function SaveTIFF(doc, saveFile){
  tiffSaveOptions = new TiffSaveOptions();
  tiffSaveOptions.embedColorProfile = true;
  tiffSaveOptions.alphaChannels = false;
  tiffSaveOptions.layers = false;
  tiffSaveOptions.imageCompression = TIFFEncoding.TIFFZIP;
  doc.saveAs(saveFile, tiffSaveOptions, true);
}

function SaveJPEG(doc, saveFile){
  // var doc = activeDocument;

  // opts = new ExportOptionsSaveForWeb();
  // opts.format = SaveDocumentType.JPEG;
  // opts.typename = 'jpg';
  // opts.quality = 100;
  // opts.ExportOptionsSaveForWeb = true;

  jpgSaveOptions = new JPEGSaveOptions();
  jpgSaveOptions.embedColorProfile = true;
  jpgSaveOptions.formatOptions = FormatOptions.STANDARDBASELINE;
  jpgSaveOptions.matte = MatteType.NONE;
  jpgSaveOptions.quality = 12;


  doc.saveAs(saveFile, jpgSaveOptions, true, Extension.LOWERCASE);
  // doc.exportDocument(saveFile, ExportType.SAVEFORWEB, opts);

}

function placeFile(file) {
  var desc = new ActionDescriptor();
  desc.putPath( charIDToTypeID('null'), file );
  desc.putEnumerated( charIDToTypeID('FTcs'), charIDToTypeID('QCSt'), charIDToTypeID('Qcsa') );
    var offsetDesc = new ActionDescriptor();
    offsetDesc.putUnitDouble( charIDToTypeID('Hrzn'), charIDToTypeID('#Pxl'), 0.000000 );
    offsetDesc.putUnitDouble( charIDToTypeID('Vrtc'), charIDToTypeID('#Pxl'), 0.000000 );
  desc.putObject( charIDToTypeID('Ofst'), charIDToTypeID('Ofst'), offsetDesc );
  executeAction( charIDToTypeID('Plc '), desc, DialogModes.NO );
};
