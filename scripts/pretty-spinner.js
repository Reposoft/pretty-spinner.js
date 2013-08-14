/**
 * Plugin for a spin-wheel. The kind that can often be found in many mobile OSes natively.
 * Although more simple.
 * Usage:
 * jQuery plugin 'prettySpinner'. See available options from the defaults object in the code.
 * $(el).prettySpinner(options) will return an object with a function called 'liveValue'.
 * liveValue should be passed a callback to be used for listening on changes to the value.
 * The callback will be called every time after the user releases the wheel.
 */
(function ($, undefined) {
	'use strict';

	/**
	 *
	 */
	var SpinView = Backbone.View.extend({

		tagName: 'div',

		className: 'pretty-spinner arrow_box',

		initialize: function (options) {
			this.value = options.default;
			this.$el.hammer();

			this.fillWheel();
		},

		fillWheel: function () {
			var container = document.createElement('ul');
			container.className = 'unstyled pretty-spinner-inner';

			var tmpl;
			for (var i = this.options.min; i <= this.options.max; i += this.options.step) {
				tmpl = document.createElement('li');
				tmpl.innerHTML = i;
				tmpl.className = 'pretty-spinner-wheel';
				container.appendChild(tmpl);
			}

			this.$el.append(container);
		},

		render: function () {
			var margin = (-this.value * 30) / this.options.step;
			this.$('.pretty-spinner-wheel:first-child').css('margin-top', margin + 2 * 30);

			return this;
		},

		round: function () {
			this.value = Math.round(this.value / this.options.step) * this.options.step;

			this.model.set('value', this.value);

			this.render();
		},

		events: {
			'dragup': 'spin',
			'dragdown': 'spin',
			'dragend': 'round'
		},

		spin: function (e) {
			var gesture = e.gesture;

			var movement = gesture.velocityY * (gesture.direction === 'up' ? 1 : -1);

			this.value += this.options.step * movement;

			if (this.value < this.options.min) {
				this.value = this.options.min;
			}
			if (this.value > this.options.max) {
				this.value = this.options.max;
			}

			this.render();
		}
	});

	/**
	 * Destroys a spinner set for a specified element if it exists.
	 */
	var destroySpinner = function (el) {
		if (!spinners[el]) { return undefined; }

		var value = spinners[el].value;

		spinners[el].remove();
		spinners[el] = undefined;

		return value;
	};

	// Storage for different element's spinners
	var spinners = {};

	// Replace in plugin options object to override these defaults
	var defaults = {
		min: 0,
		max: 100,
		'default': 10,
		step: 0.5
	};

	/**
	 * Exposed interface. The defaults object above explains possible options.
	 * If options equals 'destroy' the plugin is disabled.
	 */
	$.fn.prettySpinner = function (options) {
		if (options === 'destroy') { return destroySpinner(this); }

		options = $.extend({}, defaults, options);

		var spinModel = new Backbone.Model();

		options.model = spinModel;

		var spinView = new SpinView(options);

		// Store the view so we have a reference for removal
		spinners[this] = ('prettySpinner', spinView);

		// Append
		spinView.render().$el.appendTo(options.selector || 'body');

		// Position
		var offsetEl = $(options.selector || this);
		var offset = offsetEl.offset() || {};

		offset.left += offsetEl.width() + 35;
		offset.top -= spinView.$el.outerHeight(true) / 2 - 8;

		spinView.$el.offset(offset);

		return {
			liveValue: function liveValue(callback) {
				spinModel.on('change:value', function (model) {
					callback(model.changed.value);
				});
			}
		};
	};
}(jQuery));