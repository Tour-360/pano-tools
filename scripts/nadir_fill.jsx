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




var files = options.files.split(',');

for(var i = 0; i < files.length; i++){
	var file = new File(files[i]);
	app.open( file );
	makeCircle(829,829,660,660,true)
	contentAwareFill()
    SaveTIFF(activeDocument, file);
	activeDocument.close(SaveOptions.DONOTSAVECHANGES);
}

executeAction(app.charIDToTypeID('quit'), undefined, DialogModes.NO);



function contentAwareFill() {
    //works only with selection
    try {var SB = activeDocument.selection.bounds}
    catch (e) {alert('content aware fill needs a selection'); return};

    //100% opacity, normal blending content aware fill
    var desc = new ActionDescriptor();
    desc.putEnumerated( charIDToTypeID( "Usng" ), charIDToTypeID( "FlCn" ), stringIDToTypeID( "contentAware" ) );
    executeAction( charIDToTypeID( "Fl  " ), desc, DialogModes.NO );
}



function makeCircle(left,top,width,height,antiAlias){

    width+=left;
    height+=top;

    var circleSelection = charIDToTypeID( "setd" );
    var descriptor = new ActionDescriptor();
    var id71 = charIDToTypeID( "null" );

    var ref5 = new ActionReference();
    var id72 = charIDToTypeID( "Chnl" );
    var id73 = charIDToTypeID( "fsel" );
        ref5.putProperty( id72, id73 );
        descriptor.putReference( id71, ref5 );
    var id74 = charIDToTypeID( "T   " );
    var desc12 = new ActionDescriptor();

    var top1 = charIDToTypeID( "Top " );
    var top2 = charIDToTypeID( "#Pxl" );
        desc12.putUnitDouble( top1, top2, top );

    var left1 = charIDToTypeID( "Left" );
    var left2 = charIDToTypeID( "#Pxl" );
        desc12.putUnitDouble( left1, left2, left );

    var bottom1 = charIDToTypeID( "Btom" );
    var bottom2 = charIDToTypeID( "#Pxl" );
        desc12.putUnitDouble( bottom1, bottom2, height );

    var right1 = charIDToTypeID( "Rght" );
    var right2 = charIDToTypeID( "#Pxl" );
        desc12.putUnitDouble( right1, right2, width );

    var id83 = charIDToTypeID( "Elps" );
        descriptor.putObject( id74, id83, desc12 );
    var id84 = charIDToTypeID( "AntA" );
        descriptor.putBoolean( id84, antiAlias );
    executeAction( circleSelection, descriptor, DialogModes.NO );
}


function SaveTIFF(doc, saveFile){
  tiffSaveOptions = new TiffSaveOptions();
  tiffSaveOptions.embedColorProfile = true;
  tiffSaveOptions.alphaChannels = false;
  tiffSaveOptions.layers = false;
  tiffSaveOptions.imageCompression = TIFFEncoding.TIFFZIP;
  doc.saveAs(saveFile, tiffSaveOptions, true);
}



