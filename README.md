pretty-spinner.js
==============

## Description
A mobile-like spinner wheel widget that tries to implement touch-friendly interaction in the browser.

#### Note
Only tested for FF 23 and Chrome 28,

### Dependencies
* Hammer.js
* jQuery (tested with >=2.0)
* Backbone
* Underscore

### Usage
pretty-spinner.js is activated as a jQuery plugin
var ps = $(el).prettySpinner();

The returned object will have the following interface to interact with the widget:
* ps.liveValue(fn), proxies the updated value from the spinner continously back to the callback
* ps.updatePosition(), forces the spinner to (re-)calculate its position towards the element it has been enabled on.
* ps.remove(), disables and removes the spinner from the DOM
* ps.done(fn), proxies the final value from the spinner to the callback. Intended use is when you're only ever interested in the value once the user has pressed enter to close the spinner manually.

