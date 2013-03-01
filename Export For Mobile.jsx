/**
 * Exports several versions of an image for mobile development.
 *
 * <p>Feed in one or more high resolution (e.g. 2x) graphics and it will export
 * for web/devices at your selected sizes e.g. 2x, 1.5x, 1x by downscaling the original and saving
 * them as suffixed images in the same folder.</p>
 */

// Enable double clicking from the Macintosh Finder or the Windows Explorer
#target photoshop

app.bringToFront();

// Ensure we're working with Pixels
app.preferences.rulerUnits = Units.PIXELS;
app.displayDialogs = DialogModes.NO;


/*************************************************************
 * GUI
 */

var win = new Window("dialog", "Export for Mobile Devices");
win.alignChildren = "left";

var windowWidth = 260, panelMargin = 35;

var platformPanel, sizesPanel, outputPanel, notePanel;

// Create GUI
platformPanel = createPlatformPanel();
sizesPanel = createSizesPanel();
outputPanel = createOutputPanel();
notePanel = createNotePanel();

// Add Buttons
var buttonsGroup = win.add("group");
buttonsGroup.alignment = "right";
var exportBtn = buttonsGroup.add("button", undefined, "OK");
var cancelBtn = buttonsGroup.add("button", undefined, "Cancel");
cancelBtn.onClick = function() { win.close(); };
exportBtn.onClick = function() {
	// Get GUI options
	var sizes = sizesPanel.getSizes();
	if(sizes.length == 0) {
		alert("You must specify size(s) to continue");
		return;
	}
	
	var format = outputPanel.getFormat().toUpperCase();
	var quality = outputPanel.getQuality();
	var platform = platformPanel.getPlatform();
	var labels = sizesPanel.getLabels();

	win.close();

	// Export Images
	exportForMobile(format, quality, platform, sizes, labels);
};

// Prepopulate and show GUI
init();

// Init form and default to IOS
function init() {

	// Set Default to iOS
	platformPanel.setPlatform("iOS");
	sizesPanel.add("2:1 (retina @2x)", true);
	sizesPanel.add("1:1 (normal)", true);
	sizesPanel.setSizes([1, 0.5]);
	sizesPanel.setLabels(["@2x", ""]);
	outputPanel.addNamingItem("iPhone / iPad", 0, true);
	outputPanel.addNamingItem("iPhone 5", 1);
	outputPanel.addExample("filename@2x.png");
	outputPanel.addExample("filename.png");
	outputPanel.addExample("", true);
	notePanel.setRatio(2);

	// Show GUI
	win.show();
}

/*************************************************************
 * PLATFORM PANEL
 */

function createPlatformPanel() {
	
	var osp = win.add("panel", undefined, "Platform");
	osp.orientation = "row";
	osp.minimumSize = [windowWidth, 20];
	osp.addEventListener("click", platformHandler);
	
	var iOSBtn = osp.add("radiobutton", undefined, "\u00A0iOS");
	var androidBtn = osp.add("radiobutton", undefined, "\u00A0Android");
	var numPlatforms = osp.children.length;

	var getPlatform = function() {
		var option;
		for(var i = 0; i < numPlatforms; i++) {
			option = osp.children[i];
			if(option.value == true) {
				return option.text.substr(1).toLowerCase();
			}
		}
	};

	var setPlatform = function(p) {
		switch(p.toLowerCase()) {
			case "ios":
				iOSBtn.value = true;
				break;
			case "android":
				androidBtn.value = true;
				break;
		}
	};

	function platformHandler(e) {
	
		// Clear existing sizes
		sizesPanel.clear();

		// Clear existing naming options and examples
		outputPanel.clearNamingItems();

		// Refresh Sizes
		switch(getPlatform()) {
			case "android":
				sizesPanel.add("3:1 (xxhdpi) ~480 dpi");
				sizesPanel.add("2:1 (xhdpi) ~320 dpi", true);
				sizesPanel.add("1.5:1 (hdpi) ~240 dpi", true);
				sizesPanel.add("1.33:1 (tvdpi) ~213 dpi");
				sizesPanel.add("1:1 (mdpi) ~160 dpi", true);
				sizesPanel.add("0.75:1 (ldpi) ~120 dpi");
				outputPanel.addNamingItem("Android", 0);
				outputPanel.addNamingItem("Titanium", 1, true);
				break;

			case "ios":
				sizesPanel.add("2:1 (retina @2x)", true);
				sizesPanel.add("1:1 (normal)", true);
				outputPanel.addNamingItem("iPhone / iPad", 0, true);
				outputPanel.addNamingItem("iPhone 5", 1);
				break;
		}

		// Update UI
		win.layout.layout(1);

		// Updates the Note section text
		sizesPanel.refreshUI();
	}
	
	return {
		getPlatform: getPlatform,
		setPlatform: setPlatform
	}
}

/*************************************************************
 * SIZES PANEL
 */

function createSizesPanel() {
	
	// Empty Sizes panel gets populated based on platform selection
	var sp = win.add("panel", undefined, "Sizes");
	sp.alignChildren = "left";
	sp.minimumSize = [windowWidth, undefined];

	var createSizeCheckbox = function(label, selected) {
		label += selected ? '", value: true' : '"';
		var size = sp.add('checkbox {text: "\u00A0'+label+'}');
		size.onClick = refreshUI;
	};
	var clearSizes = function() {
		while(sp.children.length > 0) {
	    	sp.remove(sp.children[0]);
		}
	};

	var sizes = [], labels = [];
	var getSizes = function() {
		return sizes;
	};
	var getLabels = function() {
		return labels;
	};
	var setSizes = function(arr) {
		sizes = arr;
	};
	var setLabels = function(arr) {
		labels = arr;
	}

	var iPhone5Toggle = function(is16x9) {
		// Disable 1:1
		if(is16x9) {
			sp.children[0].value = true;
			sp.children[1].value = false;
			sp.children[1].enabled = false;
			sizes = [1];
		// Enable 1:1
		} else {
			labels = [2];
			sp.children[0].value = true;
			sp.children[1].value = true;
			sp.children[1].enabled = true;
		}
	};

	var refreshUI = function() {

		outputPanel.clearExamples();

		var platform = platformPanel.getPlatform();
		var type = outputPanel.getFormat().toLowerCase();
		sizes = [], labels = [];

		var naming = outputPanel.getNamingScheme();
		var titanium = naming == "Titanium";
   		var iPhone5 = naming == "iPhone 5";

		var size, numSizes = sp.children.length;
		var ratio, label, scale = 0, baseRatio = 0;
		var t, s1, s2, example;

		for(var i = 0; i < numSizes; i++) {
			size = sp.children[i];
			if(size.enabled == false) continue;
			if(size.value == true) {
				// Get scale ratio
				ratio = parseFloat(size.text.substr(1, size.text.indexOf(":")-1));
				if(ratio > scale) {
					scale = baseRatio = ratio;
				}

				if(platform == "ios") {
					// Store ratio for iOS e.g. @2x
					if(!iPhone5) {
						example = (ratio != 1) ? "filename@" + ratio.toString().replace(".", "-") + "x."+type : "filename."+type;
						outputPanel.addExample(example);
						labels.push((ratio != 1) ? "@"+ratio+"x" : "");
					} else {
						outputPanel.addExample("filename-586@2x."+type);
						labels.push("-568@"+ratio+"x");
					}

				} else if(platform == "android") {
					// Store dpi for Android e.g. xhdpi
					t = size.text;
					s1 = t.indexOf("(") + 1;
					s2 = t.indexOf(")") - s1;
					label = t.substr(s1, s2);
					
					if(titanium) {
						outputPanel.addExample("/res-"+label+"/filename."+type);
						labels.push("/res-"+label);
						
					} else {
						outputPanel.addExample("/res/drawable-"+label+"/filename."+type);
						labels.push("/res/drawable-"+label);
					}
				}
				
				sizes.push(ratio / baseRatio);
			}
		}

		// Used for spacing
		outputPanel.addExample("", true);

		// Update Note Panel
		if(baseRatio > 0) {
			notePanel.setRatio(baseRatio);
			exportBtn.enabled = true;
		} else {
			notePanel.setMessage("You must select at least one size");
			exportBtn.enabled = false;
		}
		
		// Update UI
		win.layout.layout(1);
	};

	return {
		add: createSizeCheckbox,
		clear: clearSizes,
		refreshUI: refreshUI,
		getSizes: getSizes,
		getLabels: getLabels,
		setSizes: setSizes,
		setLabels: setLabels,
		iPhone5Toggle: iPhone5Toggle
	}
}

/*************************************************************
 * OUTPUT PANEL
 */

function createOutputPanel() {
	
	var fp = win.add("panel", undefined, "Output");
	fp.alignChildren = "left";

	var rowGroup = fp.add("group {alignChildren: 'left', orientation: 'row'}");
	var formats = rowGroup.add("dropdownlist", undefined, ["PNG-24", "JPG"]);
	formats.selection = 0;

	var qualityTxt = rowGroup.add('edittext {text: 100, characters: 3, justify: "center", active: true}');
	qualityTxt.enabled = false;
	var slider = rowGroup.add('slider {minValue: 0, maxValue: 100, value: 100}');
	slider.enabled = false;

	var folderGroup = fp.add("group {alignChildren: 'left'}");
	folderGroup.alignChildren = "left";
	var folders = folderGroup.add("dropdownlist", undefined, []);
	folders.minimumSize = [windowWidth - panelMargin, undefined];

	var examplePanel = fp.add("panel", undefined, "Example");
	examplePanel.alignChildren = "left";
	examplePanel.minimumSize = [windowWidth - panelMargin, undefined];

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

		sizesPanel.refreshUI();
	};

	var clearNamingItems = function() {
		folders.onChange = null;
		while(folders.children.length > 0) {
	    	folders.remove(folders.children[0]);
		}
	};
	var clearExamples = function() {
		while(examplePanel.children.length > 0) {
	    	examplePanel.remove(examplePanel.children[0]);
		}
	}

	var addNamingItem = function(label, index, selected) {
		folders.add('item', label, index);
		if(selected) {
			folders.selection = index;
			folders.onChange = namingHandler;
		}
	};

	var namingHandler = function() {	
		if(platformPanel.getPlatform() == "ios") {
			sizesPanel.iPhone5Toggle(folders.selection.toString() == "iPhone 5");
		}
		sizesPanel.refreshUI();
	};

	var addExampleItem = function(label, isLast) {
		var ex = examplePanel.add("statictext", undefined, label);
		ex.maximumSize = [windowWidth - panelMargin, isLast ? 1 : 5];
	};

	var getFormat = function() {
		return formats.selection.toString().substr(0, 3);
	};
	var getQuality = function() {
		return qualityTxt.text;
	};
	var getNamingScheme = function() {
		return folders.selection.toString();
	};

	return {
		getQuality: getQuality,
		getFormat: getFormat,
		getNamingScheme: getNamingScheme,
		clearNamingItems: clearNamingItems,
		clearExamples: clearExamples,
		addNamingItem: addNamingItem,
		addExample: addExampleItem
	}
}

/*************************************************************
 * NOTE PANEL
 */

function createNotePanel() {

	var np = win.add("panel", undefined, "Note");
	np.minimumSize = [windowWidth, undefined];
	var note = np.add("statictext", undefined, "", {multiline:true});
	
	var setNote = function(ratio) {
		note.text = "Select image(s) designed at the dimensions of your "+ratio+":1 image.";
	};
	var setMessage = function(msg) {
		note.text = msg;
	};

	return {
		setRatio: setNote,
		setMessage: setMessage
	}
}

/*************************************************************
 * EXPORTING
 */

function exportForMobile(format, quality, platform, sizes, labels) {

	// Show Open Prompt with support for multiple files
	var openDialog = app.openDialog();

	var doc, file, name, filename, t, type, folder, basePath, savePath, width, height, state;
	var numFiles = openDialog.length;

	// Add progress bar
	var win = new Window("palette", "Exporting for Mobile Devices...");
	var progressBar = win.add("progressbar", undefined, 0, sizes.length * numFiles);
	progressBar.preferredSize = [250, 20];
	win.show();

	var DPI = 72;

	var size, ratio, numSizes = sizes.length, c = 0, suffix = "";
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
		type = name.substr(t+1).toLowerCase();

		basePath = savePath = doc.path + "/generated";
		folder = new Folder(basePath);
		if(!folder.exists) folder.create();

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
			
			size = labels[j].toString();
			ratio = sizes[j];

			// Update filename, use default savePath
			if(platform == "ios") {
				suffix = size;
			// Update savePath, use default filename
			} else if(platform == "android") {
				savePath = basePath + size;
				folder = new Folder(savePath);
				if(!folder.exists) folder.create();
			}

			if(j == 0) {
				saveForWeb(savePath, filename + suffix, format, quality);
			} else {
				// Resize and save image at the selected size
				doc.resizeImage(width * ratio, height * ratio, DPI, ResampleMethod.BICUBIC);
				saveForWeb(savePath, filename + suffix, format, quality);
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
	// TODO: Add support for replace/ignore if file exists?
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