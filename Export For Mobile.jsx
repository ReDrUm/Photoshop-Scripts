// Enable double clicking from the Macintosh Finder or the Windows Explorer
#target photoshop

app.bringToFront();

main();

// TODO: Create Window UI. Expose scale options e.g. tick boxes for 2x, 1.5x, 1x etc. allow auto folder structure for Ti android? 

/**
 * Exports several versions of an image for mobile development.
 *
 * <p>Feed in one or more Retina (2x) sized graphics and it will export
 * for web/devices at 2x, 1.5x, 1x by downscaling the original and saving
 * them as suffixed PNG's in the same folder.</p>
 */
function main() {

	// Ensure we're working with Pixels
	app.preferences.rulerUnits = Units.PIXELS;
	app.displayDialogs = DialogModes.NO;

	// Constants
	var DPI = 72;

	// Show Open Prompt with support for multiple files
	var openDialog = app.openDialog();

	// FIXME: Remove file var and replace with doc...
	var doc, file, name, filename, type, folder, width, height, state;
	var numFiles = openDialog.length;
	//alert("Num Files Opened: "+numFiles);
	for(var i = 0; i < numFiles; i++)
	{
		// Access individual file
		file = File(openDialog[i]);

		// Open file
		doc = app.open(file);

		// Store filename and path
		name = doc.name;
		type = name.lastIndexOf(".");
		filename = name.substr(0, type); // remove file extension
		folder = doc.path;

		// FIXME: Clear slices to allow output. Otherwise figure out how to rename slice names...
		if(type == "psd") app.runMenuItem(stringIDToTypeID("clearSlices"));

		// Store original dimensions
		width = doc.width;
		height = doc.height;

		// Flatten image to ensure it scales layer styles (add new empty layer to ensure Merge Visible is available)
		doc.artLayers.add();
		doc.mergeVisibleLayers();

		// Store history state
		state = doc.historyStates[doc.historyStates.length-1];
		state.snapshot = true;
		
		// Save iOS Retina and Android 'xhigh' at 2x 
		saveForWebPNG(folder, filename + "@2x");

		// Save Android 'high' at 1.5x
		doc.resizeImage(width * 0.75, height * 0.75, DPI, ResampleMethod.BICUBIC);
		saveForWebPNG(folder, filename + "@1-5x");
		
		// Restore to original size and reflatten styles
		doc.activeHistoryState = state;

		// Save iOS normal and Android 'medium' at 1x
		doc.resizeImage(width * 0.5, height * 0.5, DPI, ResampleMethod.BICUBIC);
		saveForWebPNG(folder, filename);

		// Close without saving changes
		doc.close(SaveOptions.DONOTSAVECHANGES);
	}
	
	alert("PNG's Successfully Exported.");
}

function saveForWebPNG(outputFolderStr, filename)
{
    var opts, file;
    opts = new ExportOptionsSaveForWeb();
    opts.format = SaveDocumentType.PNG;
    opts.PNG8 = false;
    opts.quality = 100;
    if (filename.length > 27) {
        file = new File(outputFolderStr + "/temp.png");
        app.activeDocument.exportDocument(file, ExportType.SAVEFORWEB, opts);
        file.rename(filename + ".png");
    }
    else {
        file = new File(outputFolderStr + "/" + filename + ".png");
        app.activeDocument.exportDocument(file, ExportType.SAVEFORWEB, opts);
    }
}