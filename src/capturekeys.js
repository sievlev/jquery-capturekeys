(function($, undefined) {
"use strict";

/* Keys with left and right locations */
var LOCATION_KEYS = [ "Shift", "Control", "Alt", "Win" ];

/* Map special key names between Opera and other DOM3 browsers */
var DOM3_SPECIAL_KEYS = {
	"Window": "Win",
	"ContextMenu": "Apps",
	"ScrollLock": "Scroll",
	"Subtract": "-",
	"Add": "+",
	"Mul": "*",
	"Divide": "/"
};

/* Map special key names between webkit based browsers and DOM3 browsers */
var WEBKIT_SPECIAL_KEYS = {
	"U+0009": "Tab",
	"U+007F": "Delete",
	"U+0020": "Spacebar"
};

/* Windows version of Chrome lose keyLocation property in 'keyup' event */
var WEBKIT_PRESSED_KEYS = {};

/* Map special key names between old DOM2 browsers and DOM3 browsers */
var DOM2_SPECIAL_KEYS = {
	8:  "Backspace",
	9:  "Tab",
	13: "Enter",
	16: "Shift",
	17: "Control",
	18: "Alt",
	19: "Pause",
	20: "CapsLock",
	27: "Esc",
	32: "Spacebar"
};

function event_with_location(event, key, location) {
	if (key in DOM3_SPECIAL_KEYS) {
		key = DOM3_SPECIAL_KEYS[key];
	}

	if (!location && ($.inArray(key, LOCATION_KEYS) >= 0)) {
		location = 1;
	}

	event.key = key;
	event.location = location;
	return event;
}

function is_webkit_special(key) {
	return (key in WEBKIT_SPECIAL_KEYS || (key.length > 1 && (key.indexOf("U+") === -1)));
}

function webkit_key(key) {
	if (key in WEBKIT_SPECIAL_KEYS) {
		return WEBKIT_SPECIAL_KEYS[key];
	}
	return key;
}

function is_dom2_special(key) {
	return key in DOM2_SPECIAL_KEYS;
}

function dom2_key(key) {
	return DOM2_SPECIAL_KEYS[key];
}

function handle_key(event, callback) {
	var orig_event = event.originalEvent;

	if ("key" in orig_event) {
		callback(event_with_location(event, orig_event.key, orig_event.location));
	} else if (("keyIdentifier" in orig_event) && is_webkit_special(orig_event.keyIdentifier)) {
		var key = orig_event.keyIdentifier;
		var location = orig_event.keyLocation;

		// Windows version of Chrome lost keyLocation property in 'keyup' event
		if ($.inArray(key, LOCATION_KEYS) !== -1) {
			switch(event.type) {
				case "keydown":
					WEBKIT_PRESSED_KEYS[key] = location;
					break;
				case "keyup":
					if (!location) {
						location = WEBKIT_PRESSED_KEYS[key];
					}
					WEBKIT_PRESSED_KEYS[key] = 0;
					break;
			}
		}
		callback(event_with_location(event, webkit_key(key), location));
	} else if (is_dom2_special(event.which)) {
		callback(event_with_location(event, dom2_key(event.which), orig_event.location || 0));
	}
}

function handle_keypress(event, callback) {
	if (event.which && !is_dom2_special(event.which)) {
		var key = String.fromCharCode(event.which);

		callback(event_with_location({ type: "keydown" }, key, 0));
		callback(event_with_location({ type: "keyup" }, key, 0));
	}
}

$.fn.capturekeys = function() {
	var self = this;

	function callback(event) {
		event.type = "dom3" + event.type;
		self.trigger($.Event(event, {key: event.key, location: event.location}));
	}

	return self
		.on("keyup.capturekeys keydown.capturekeys", function(event) { return handle_key(event, callback); })
		.on("keypress.capturekeys", function(event) { return handle_keypress(event, callback); });
};

$.fn.releasekeys = function(callback) {
	this.off(".capturekeys");
};

})(jQuery);
