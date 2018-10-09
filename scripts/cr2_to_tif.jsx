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






var dir = Folder(options.rawImport);
var files = dir.getFiles(/\.(CR2|)$/i);
for(var i = 0; i < files.length; i++){
  var rawFile = new File(files[i]);
  var fileName = files[i].fsName.split('/').pop().split('.')[0];
  var newFile = new File(options.rawExport+"/"+fileName+'.tif');
  // if (!rawFile.exists) throw new Exception("File doesn't exist");
  if(!newFile.exists) {
    var docRef = app.documents.add('3840px', '5760px', 300, "file", NewDocumentMode.RGB, undefined, undefined, BitsPerChannelType.SIXTEEN);
    placeFile( rawFile );
    SaveTIFF( docRef, newFile);
    docRef.close(SaveOptions.DONOTSAVECHANGES);
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
