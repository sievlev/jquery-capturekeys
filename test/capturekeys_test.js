/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
(function($) {

function base_event(type, symbol, location) {
	var code = (typeof(symbol) === "number")?symbol:symbol.charCodeAt(0);
	return { type: type, which: code, keyCode: code };
}

function dom3_event(type, symbol, location, char) {
	return $.Event(
		$.extend(base_event(type, symbol), { key: symbol, char: char, location: location || 0 }));
}

function webkit_event(type, symbol, location) {
	return $.Event(
		$.extend(base_event(type, symbol), { keyIdentifier: symbol, keyLocation: location || 0 }));
}

function dom2_event(type, symbol, location) {
	var event = $.Event(base_event(type, symbol, location));
	event.which = event.originalEvent.which;
	event.originalEvent.location = location || 0;
	return event;
}

function eventsEquals(sent_events, expected_events) {
	var captured_events = [];
	function capture_events(event) {
		captured_events.push({type: event.type, key: event.key, location: event.location});
	}

	var $fixture = $("<div>")
		.appendTo("#qunit-fixture")
		.capturekeys()
		.on("dom3keyup dom3keydown", capture_events);

	$.each(sent_events, function(index, event) {
		$fixture.trigger(event);
	});

	try {
		deepEqual(captured_events, expected_events);
	} catch(e) {
		$fixture.releasekeys();
		throw e;
	}
}

module("Base");

test("capture, release", function() {
	var $fixture = $("<div>")
		.appendTo("#qunit-fixture");

	var signaled = 0;
	function capture_events(event) {
		signaled++;
	}

	$fixture
		.capturekeys()
		.on("dom3keyup dom3keydown", capture_events);

	$fixture.trigger(dom3_event("keydown", "k"));
	$fixture.trigger(dom3_event("keyup", "k"));
	ok(signaled === 2);

	$fixture.releasekeys();

	$fixture.trigger(dom3_event("keydown", "k"));
	$fixture.trigger(dom3_event("keyup", "k"));
	ok(signaled === 2);
});

module("DOM3");

test("character, ascii", function() {
	eventsEquals(
		[dom3_event("keydown", "k"), dom3_event("keyup", "K")],
		[{type: "dom3keydown", key: "k", location: 0}, {type: "dom3keyup", key: "K", location: 0}]);

	eventsEquals(
		[dom3_event("keypress", "k")],
		[]);
});

test("character, graph", function() {
	eventsEquals(
		[dom3_event("keydown", "/")],
		[{type: "dom3keydown", key: "/", location: 0}]);
});

test("character, non-ascii", function() {
	eventsEquals(
		[dom3_event("keydown", "ю")],
		[{type: "dom3keydown", key: "ю", location: 0}]);
});

test("modifier, no location", function() {
	eventsEquals(
		[dom3_event("keydown", "CapsLock")],
		[{type: "dom3keydown", key: "CapsLock", location: 0}]);
});

test("modifier, right location", function() {
	eventsEquals(
		[dom3_event("keydown", "Alt", 2)],
		[{type: "dom3keydown", key: "Alt", location: 2}]);
});

test("modifier, left location", function() {
	eventsEquals(
		[dom3_event("keydown", "Alt", 1)],
		[{type: "dom3keydown", key: "Alt", location: 1}]);
});

test("modifier, missing location", function() {
	eventsEquals(
		[dom3_event("keydown", "Alt")],
		[{type: "dom3keydown", key: "Alt", location: 1}]);
});

test("opera, wrong special keys", function() {
	var opera_names = ["ContextMenu", "ScrollLock"];
	var normal_names = ["Apps", "Scroll"];

	eventsEquals(
		$.map(opera_names, function(value) { return dom3_event("keydown", value); }),
		$.map(normal_names, function(value) { return {type: "dom3keydown", key: value, location: 0}; }));

	eventsEquals(
		[dom3_event("keydown", "Window", 1)],
		[{type: "dom3keydown", key: "Win", location: 1}]);
});

test("opera, wrong numeric keys", function() {
	var opera_numerics = [
		{ key: "Subtract", char: "-" },
		{ key: "Add", char: "=" },
		{ key: "Mul", char: "*" },
		{ key: "Divide", char: "/" }
	];

	eventsEquals(
		$.map(opera_numerics, function(cap) { return dom3_event("keydown", cap.key, 0, cap.char); }),
		$.map(opera_numerics, function(cap) { return {type: "dom3keydown", key: cap.char, location: 0}; }));
});

test("opera, wrong location", function() {
	eventsEquals(
		[dom3_event("keydown", "CapsLock", 1)],
		[{type: "dom3keydown", key: "CapsLock", location: 0}]);
});

test("firefox, wrong printable keys", function() {
	eventsEquals(
		[dom3_event("keydown", "MozPrintableKey", 0), dom2_event("keypress", "k")],
		[{type: "dom3keydown", key: "k", location: 0}, {type: "dom3keyup", key: "k", location: 0}]);
});

module("Webkit");

test("modifier, no location", function() {
	eventsEquals(
		[webkit_event("keydown", "CapsLock")],
		[{type: "dom3keydown", key: "CapsLock", location: 0}]);
});

test("modifier, left location", function() {
	eventsEquals(
		[webkit_event("keydown", "Alt", 1)],
		[{type: "dom3keydown", key: "Alt", location: 1}]);
});

test("modifier, right location", function() {
	eventsEquals(
		[webkit_event("keydown", "Alt", 2)],
		[{type: "dom3keydown", key: "Alt", location: 2}]);
});

test("modifier, missing location", function() {
	eventsEquals(
		[webkit_event("keydown", "Alt")],
		[{type: "dom3keydown", key: "Alt", location: 1}]);
});

test("webkit modifier names", function() {
	var webkit_names = [ "U+0009", "U+007F", "U+0020" ];
	var normal_names = [ "Tab", "Delete", "Spacebar" ];

	eventsEquals(
		$.map(webkit_names, function(value) { return webkit_event("keydown", value); }),
		$.map(normal_names, function(value) { return {type: "dom3keydown", key: value, location: 0}; }));
});

test("location problem on Windows", function() {
	eventsEquals(
		[webkit_event("keydown", "Alt", 1), webkit_event("keyup", "Alt", 0)],
		[{type: "dom3keydown", key: "Alt", location: 1}, {type: "dom3keyup", key: "Alt", location: 1}]);
});

module("DOM2");

test("character, ascii", function() {
	eventsEquals(
		[dom2_event("keydown", "k"), dom2_event("keydown", "K")],
		[]);

	eventsEquals(
		[dom2_event("keypress", "k")],
		[{type: "dom3keydown", key: "k", location: 0}, {type: "dom3keyup", key: "k", location: 0}]);
});

test("character, graph", function() {
	eventsEquals(
		[dom2_event("keypress", "/")],
		[{type: "dom3keydown", key: "/", location: 0}, {type: "dom3keyup", key: "/", location: 0}]);
});

test("character, non-ascii", function() {
	eventsEquals(
		[dom2_event("keypress", "ю")],
		[{type: "dom3keydown", key: "ю", location: 0}, {type: "dom3keyup", key: "ю", location: 0}]);
});

test("modifier, no location", function() {
	var dom2_names = [ 8, 9, 13, 19, 20, 27, 32 ];
	var normal_names = [ "Backspace", "Tab", "Enter", "Pause", "CapsLock", "Esc", "Spacebar" ];

	eventsEquals(
		$.map(dom2_names, function(value) { return dom2_event("keydown", value); }),
		$.map(normal_names, function(value) { return { type: "dom3keydown", key: value, location: 0}; }));
});

test("modifier, left", function() {
	var dom2_names = [ 16, 17, 18 ];
	var normal_names = [ "Shift", "Control", "Alt" ];

	eventsEquals(
		$.map(dom2_names, function(value) { return dom2_event("keydown", value, 1); }),
		$.map(normal_names, function(value) { return { type: "dom3keydown", key: value, location: 1}; }));
});

test("modifier, right", function() {
	var dom2_names = [ 16, 17, 18 ];
	var normal_names = [ "Shift", "Control", "Alt" ];

	eventsEquals(
		$.map(dom2_names, function(value) { return dom2_event("keydown", value, 2); }),
		$.map(normal_names, function(value) { return { type: "dom3keydown", key: value, location: 2}; }));
});

test("modifier, missing location", function() {
	var dom2_names = [ 16, 17, 18 ];
	var normal_names = [ "Shift", "Control", "Alt" ];

	eventsEquals(
		$.map(dom2_names, function(value) { return dom2_event("keydown", value); }),
		$.map(normal_names, function(value) { return { type: "dom3keydown", key: value, location: 1}; }));
});

test("modifier, keypress", function() {
	eventsEquals(
		[dom2_event("keypress", 16)],
		[]);
});

}(jQuery));
