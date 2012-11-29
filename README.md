# jQuery Capturekeys

Different browsers generate different keyboard events (See http://unixpapa.com/js/key.html for details).
These events were not defined by any standard until DOM3 which few browsers have yet implemented.

Browsers that implement DOM3 keyboard events at this time:
* Internet Explorer 9 or higher;
* Opera 12.10 or higher.

This module tries to simplify keyboard events handling across different browsers
via converting various styles of events into single format.

To use this module call capturekeys() method for specified DOM element, and then simply capture
"dom3keydown" and "dom3keyup" events.

Call of releasekeys() on same object will stop capturing of keyboard events.

Module's event contains 'key' and 'location' fields from DOM3 standard.
Original jQuery event saved in 'originalEvent' property.
You can use preventDefault() and stopPropagationMethods() as with original keyboard events.

Example:
  $("div").capturekeys().on("dom3keydown dom3keyup", event_handler);
