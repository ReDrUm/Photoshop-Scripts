// Enable double clicking from the Macintosh Finder or the Windows Explorer
#target photoshop

app.bringToFront();

// Ensure we're working with Pixels
app.preferences.rulerUnits = Units.PIXELS;
app.displayDialogs = DialogModes.NO;

// Create GUI
createGUI();

// TODO: Add support for choosing Export path (currently hardcoded to /export within the selected files folder).
// TODO: Add support for iPhone 5 auto suffixing -568h@2x.png
// TODO: Allow auto folder structure for Ti android (e.g. res/drawable-xhdpi, res/drawable/hdpi, etc) using same filename instead of suffix 
// TODO: Make platform radio buttons instead of checkboxes to allow for auto folder structuring as per above

/**
 * Exports several versions of an image for mobile development.
 *
 * <p>Feed in one or more high resolution (e.g. 2x) graphics and it will export
 * for web/devices at your selected sizes e.g. 2x, 1.5x, 1x by downscaling the original and saving
 * them as suffixed images in the same folder.</p>
 */
function createGUI() {

	// Create GUI
	var win = new Window("dialog", "Export for Mobile Devices");
	win.alignChildren = "left";

	var osGroup = win.add("panel", undefined, "Platform");
	osGroup.orientation = "row";
	osGroup.minimumSize = [250, 20];
	var iOSBtn = osGroup.add("checkbox", undefined, "\u00A0iOS");
	var androidBtn = osGroup.add("checkbox", undefined, " \u00A0Android");
	
	var sizeGroup = win.add("panel", undefined, "Sizes");
	sizeGroup.alignChildren = "left";
	sizeGroup.minimumSize = [250, undefined];

	// Set default to iOS
	iOSBtn.value = true;
	var xhdpiBtn = sizeGroup.add("checkbox", undefined, "\u00A02:1 (Retina)");
	xhdpiBtn.value = true;
	xhdpiBtn.onClick = calculateHighestScale;
	var mdpiBtn = sizeGroup.add("checkbox", undefined, "\u00A01:1 (Normal)");
	mdpiBtn.value = true;
	mdpiBtn.onClick = calculateHighestScale;
	
	// Bitwise flags
	var FLAG_IOS = 0x1;
	var FLAG_ANDROID = 0x2;
	var FLAG_WIN8PHONE = 0x4;
	var platformFlags = FLAG_IOS;

	iOSBtn.onClick = androidBtn.onClick = function() {
		
		// Clear existing buttons
		while(sizeGroup.children.length > 0) {
	    	sizeGroup.remove(sizeGroup.children[0]);
		}

		// Determine platform selections
		platformFlags = 0;
		if(iOSBtn.value == true) platformFlags = platformFlags | FLAG_IOS;
		if(androidBtn.value == true) platformFlags = platformFlags | FLAG_ANDROID;

		var ldpiBtn, mdpiBtn, tvdpiBtn, hdpiBtn, xhdpiBtn, xxhdpiBtn;

		// Android
		if(platformFlags & FLAG_ANDROID) {
			xxhdpiBtn = sizeGroup.add('checkbox {text: "\u00A03:1 (xxhdpi)"}');
			xhdpiBtn = sizeGroup.add('checkbox {text: "\u00A02:1 (xhdpi)", value: true}');
			hdpiBtn = sizeGroup.add('checkbox {text: "\u00A01.5:1 (hdpi)", value: true}');
			tvdpiBtn = sizeGroup.add('checkbox {text: "\u00A01.33:1 (tvdpi)"}');
			mdpiBtn = sizeGroup.add('checkbox {text: "\u00A01:1 (mdpi)", value: true}');
			ldpiBtn = sizeGroup.add('checkbox {text: "\u00A00.75:1 (mdpi)"}');
		}
		// iOS
		if(platformFlags & FLAG_IOS) {
			if(!xhdpiBtn) xhdpiBtn = sizeGroup.add('checkbox {text: "\u00A02:1 (Retina)", value: true}');
			if(!mdpiBtn) mdpiBtn = sizeGroup.add('checkbox {text: "\u00A01:1 (Normal)", value: true}');
		}
		
		// Both iOS And Android
		if(platformFlags == 3) {
			xhdpiBtn.text = "\u00A02:1 (iOS: Retina, Android: xhdpi)";
			mdpiBtn.text = "\u00A01:1 (iOS: Normal, Android: mdpi)";
		}

		// Add listeners
		var size, numSizes = sizeGroup.children.length;
		for(var i = 0; i < numSizes; i++) {
			size = sizeGroup.children[i];
			size.onClick = calculateHighestScale;
		}
		calculateHighestScale();

		// Update UI
		win.layout.layout(1);
	};

	var formatGroup = win.add("panel", undefined, "Format / Quality");
	formatGroup.orientation = "row";
	var formats = formatGroup.add("dropdownlist", undefined, ["PNG-24", "JPG"]);
	formats.selection = 0;
	var qualityTxt = formatGroup.add('edittext {text: 100, characters: 3, justify: "center", active: true}');
	qualityTxt.enabled = false;
	var slider = formatGroup.add('slider {minValue: 0, maxValue: 100, value: 100}');
	slider.enabled = false;

	slider.onChanging = function () {
		qualityTxt.text = Math.round(slider.value);
	};
	qualityTxt.onChanging = function () {
		slider.value = Number(qualityTxt.text);
	};

	formats.onChange = function() {
		var show = this.selection.toString() == "JPG";
		qualityTxt.enabled = show;
		qualityTxt.text = show ? 80 : 100;
		slider.enabled = show;
		slider.value = show ? 80 : 100;
	};

	var noteGroup = win.add("panel", undefined, "Note");
	noteGroup.minimumSize = [250, undefined];
	var note = noteGroup.add("statictext", undefined, "Select image(s) designed at the dimensions of your 2:1 image", {multiline:true});
	
	function calculateHighestScale() {
		var size, res = 0, numSizes = sizeGroup.children.length;
		
		for(var i = 0; i < numSizes; i++) {
			size = sizeGroup.children[i];
			if(size.value == true) {
				var scale = parseFloat(size.text.substr(0, size.text.indexOf(":")));
				if(scale > res) res = scale;
			}
		}
		// Update Note Text
		note.text = "Select image(s) designed at the dimensions of your "+res+":1 image";
	}

	var buttonsGroup = win.add("group");
	buttonsGroup.alignment = "right";
	var okBtn = buttonsGroup.add("button", undefined, "OK");
	var cancelBtn = buttonsGroup.add("button", undefined, "Cancel");
	
	okBtn.onClick = function() {

   		if(platformFlags == 0) {
   			alert("You must specify a platform and size(s) to continue");
   			return;
   		}

   		// Get GUI options
   		var type = formats.selection.toString().substr(0, 3);
   		var quality = qualityTxt.text;
   		var size, numSizes = sizeGroup.children.length, sizes = [], labels = [];
   		var ratio, baseRatio = 0;
   		for(var i = 0; i < numSizes; i++) {
   			size = sizeGroup.children[i];
   			if(size.value == true) {
   				// Get scale ratio
   				ratio = size.text.substr(1, size.text.indexOf(":")-1);
   				if(baseRatio == 0) {
   					baseRatio = ratio;
   				}
   				labels.push(ratio);
   				sizes.push(ratio / baseRatio);
   			}
   		}

   		win.close();

   		// Export Images
   		exportForMobile(type, quality, sizes, labels);
	};
	cancelBtn.onClick = function() {
		
		win.close();
	}

	win.show();
}

function exportForMobile(format, quality, sizes, labels) {

	// Show Open Prompt with support for multiple files
	var openDialog = app.openDialog();

	var doc, file, name, filename, t, type, folder, _folder, width, height, state;
	var numFiles = openDialog.length;

	// Add progress bar
	var win = new Window("palette", "Exporting for Mobile Devices...");
	var progressBar = win.add("progressbar", undefined, 0, sizes.length * numFiles);
	progressBar.preferredSize = [250, 20];
	win.show();

	var DPI = 72;

	var label, size, ratio, numSizes = sizes.length, c = 0;
	//alert("Num Files Opened: "+numFiles);
	for(var i = 0; i < numFiles; i++)
	{
		// Access individual file
		file = File(openDialog[i]);

		// Open file
		doc = app.open(file);

		// Store filename, path and type
		name = doc.name;
		t = name.lastIndexOf(".");
		filename = name.substr(0, t); // remove file extension
		folder = doc.path + "/generated";
		type = name.substr(t+1).toLowerCase();

		_folder = new Folder(folder);
		if(!_folder.exists) _folder.create();

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

		for(var j = 0; j < numSizes; j++) {
			
			size = labels[j];
			ratio = sizes[j];
			label = size != 1 ? "@" + size.replace(".", "-") + "x" : "";

			if(j == 0) {
				saveForWeb(folder, filename + label, format, quality);
			} else {
				// Resize and save image at the selected size
				doc.resizeImage(width * ratio, height * ratio, DPI, ResampleMethod.BICUBIC);
				saveForWeb(folder, filename + label, format, quality);
				// Restore to original size with flattened styles
				doc.activeHistoryState = state;
			}

			c++;
			progressBar.value = c;
		}

		// Close without saving changes
		doc.close(SaveOptions.DONOTSAVECHANGES);
	}
	
	// Close progress bar
	win.close();

	alert(c+" "+format+"'s Successfully Exported.");
}

function saveForWeb(savePath, filename, filetype, quality)
{
	var options = new ExportOptionsSaveForWeb();
	if(filetype == "JPG")
	{
		saveForWebJPG(options, savePath, filename, quality);
	}
	else
	{
		saveForWebPNG(options, savePath, filename);
	}
}

function saveForWebPNG(options, savePath, filename)
{
    var file;
    options.format = SaveDocumentType.PNG;
    options.PNG8 = false;
    options.quality = 100;
    // Fix for filename's longer than 27 characters
    file = new File(savePath + "/temp.png");
    app.activeDocument.exportDocument(file, ExportType.SAVEFORWEB, options);
    file.rename(filename + ".png");
}

function saveForWebJPG(options, savePath, filename, quality)
{
	var file;
    options.format = SaveDocumentType.JPEG;
	options.optimized = true;
    options.quality = quality;
    // Fix for filenames longer than 27 characters
    file = new File(savePath + "/temp.jpg");
    app.activeDocument.exportDocument(file, ExportType.SAVEFORWEB, options);
    file.rename(filename + ".jpg");
}