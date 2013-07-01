(function($, undefined) {
"use strict";

/* Keys with left and right locations */
var LOCATION_KEYS = [ "Shift", "Control", "Alt", "Win" ];

/* Map special key names between Opera and other DOM3 browsers */
var DOM3_SPECIAL_KEYS = {
	"Window": "Win",
	"ContextMenu": "Apps",
	"ScrollLock": "Scroll"
};

/* Opera has a strange logic for numeric keys */
var DOM3_NUMERIC_KEYS = {
	"Subtract": "-",
	"Add": "+",
	"Mul": "*",
	"Divide": "/"
};

/* Map some special key names between webkit based browsers and DOM3 browsers */
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

/* Track status of keys pressed with modifier */
var HOT_PRESSED_KEYS = {};

function event_with_location(event, key, location) {
	if (!location && ($.inArray(key, LOCATION_KEYS) >= 0)) {
		location = 1;
	} else if (location && ($.inArray(key, LOCATION_KEYS) === -1)) {
		location = 0;
	}

	event.key = key;
	event.location = location;
	return event;
}

function is_dom3(event) {
	return ("key" in event.originalEvent && event.originalEvent.key !== "MozPrintableKey");
}

function is_dom3_special(event) {
	var key = event.originalEvent.key;
	return !(key in DOM3_NUMERIC_KEYS) && key.length > 1;
}

function dom3_key(event) {
	var key = event.originalEvent.key;
	if (key in DOM3_NUMERIC_KEYS) {
		return event.originalEvent.char;
	} else if (key in DOM3_SPECIAL_KEYS) {
		return DOM3_SPECIAL_KEYS[key];
	}
	return key;
}

/* Opera adds location for keys without location, e.g., CapsLock */
function dom3_location(event, key) {
	return event.originalEvent.location;
}

function is_webkit(event) {
	return ("keyIdentifier" in event.originalEvent);
}

function is_webkit_special(event) {
	var key = event.originalEvent.keyIdentifier;
	return (key in WEBKIT_SPECIAL_KEYS || (key.length > 1 && (key.indexOf("U+") === -1)));
}

function webkit_key(event) {
	var key = event.originalEvent.keyIdentifier;
	if (key in WEBKIT_SPECIAL_KEYS) {
		return WEBKIT_SPECIAL_KEYS[key];
	}
	return key;
}

/* Windows version of Chrome lost keyLocation property in 'keyup' event */
function webkit_location(event, key) {
	var location = event.originalEvent.keyLocation;
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
	return location;
}

function is_dom2_special(event) {
	var key = event.which;
	return key in DOM2_SPECIAL_KEYS;
}

function dom2_key(event) {
	var key = event.which;
	if (key in DOM2_SPECIAL_KEYS) {
		return DOM2_SPECIAL_KEYS[key];
	}
	return String.fromCharCode(key);
}

/* Some browsers provide location for old style events */
function dom2_location(event, key) {
	return event.originalEvent.location || 0;
}

function is_hotkey(event) {
	var orig_event = event.originalEvent;
	return HOT_PRESSED_KEYS[event.which] || orig_event.altKey || orig_event.ctrlKey;
}

/* If modifier key is pressed, then all keyboard events are completely broken */
function hotkey_key(event, key, issymbol) {
	var code = event.which;
	if (HOT_PRESSED_KEYS[code] || issymbol) {
		HOT_PRESSED_KEYS[code] = (event.type === "keydown");
		key = String.fromCharCode(code);
	}
	return key;
}

function handle_key(event, callback) {
	var hotkey = is_hotkey(event);
	var key = "";
	var location = 0;
	if (is_dom3(event)) {
		key = dom3_key(event);
		location = dom3_location(event, key);
		callback(event_with_location(
			event, hotkey_key(event, key, hotkey && !is_dom3_special(event)), location));
	} else if (is_webkit(event) && (hotkey || is_webkit_special(event))) {
		key = webkit_key(event);
		location = webkit_location(event, key);
		callback(event_with_location(
			event, hotkey_key(event, key, hotkey && !is_webkit_special(event)), location));
	} else if (hotkey || is_dom2_special(event)) {
		key = dom2_key(event);
		location = dom2_location(event, key);
		callback(event_with_location(
			event, hotkey_key(event, key, hotkey && !is_dom2_special(event)), location));
	}
}

function handle_keypress(event, callback) {
	var hotkey = is_hotkey(event);
	if (is_dom3(event)) {
		return;
	} else if (is_webkit(event) && (hotkey || is_webkit_special(event))) {
		return;
	} else if (!hotkey && !is_dom2_special(event) && event.which) {
		var key = dom2_key(event);
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
