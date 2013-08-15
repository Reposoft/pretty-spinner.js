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

		className: function () {
			return 'pretty-spinner arrow_box ' + this.options.direction;
		},

		initialize: function (options) {
			this.value = window.isNaN(options.default) ? 0 : options.default;
			this.$el.hammer();

			this.fillWheel();

			this.round();
		},

		setDirection: function (direction) {
			this.$el.removeClass('top right bottom left');
			this.$el.addClass(direction);

			this.render();
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
			'dragend': 'round',
			'touch': 'setActive',
			'release': 'clearActive',
			'click': 'clickSteal'
		},

		setActive: function () {
			this.model.set('active', true);
		},

		clearActive: function () {
			this.model.set('active', false);
		},

		clickSteal: function () {
			return false;
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
	 * Positions the spinner next to the element.
	 */
	var positionSpinner = function (spinView, options) {
		// Append
		spinView.render().$el.appendTo(options.selector || 'body');

		// Position
		var offsetEl = $(options.selector || this);
		var offset = offsetEl.offset() || {};

		// Standard position is to the right of the element
		if (options.direction === 'right') {
			// Make sure that we are not outside the right end of the screen
			if (offset.left + spinView.$el.width() + offsetEl.width() + 30 > $(document).width()) {
				options.direction = 'top';
			} else {
				offset.left += offsetEl.width() + 30;
			}
		}

		// Left needs no corrections (yet)
		if (options.direction === 'left') {
			offset.left -= offsetEl.width();
		}

		if (options.direction === 'top') {
			// Make sure we are not outside the top of the screen
			if (offset.top - spinView.$el.height() - 5 < 0) {
				options.direction = 'bottom';
			} else {
				offset.top -= spinView.$el.outerHeight(true) + 5;
			}
		} else {
			// Standard top offset
			offset.top -= spinView.$el.outerHeight(true) / 2 - 8;
		}

		if (options.direction === 'bottom') {
			offset.top += spinView.$el.outerHeight(true) - 45;
		}

		spinView.setDirection(options.direction);


		spinView.$el.offset(offset);
	};

	// Replace in plugin options object to override these defaults
	var defaults = {
		min: 0,
		max: 100,
		'default': 10,
		step: 0.5,
		direction: 'right'
	};

	/**
	 * Exposed interface. The defaults object above explains possible options.
	 */
	$.fn.prettySpinner = function (options) {
		options = _.defaults(options, defaults);

		var spinModel = new Backbone.Model();

		options.model = spinModel;

		var spinView = new SpinView(options);

		var myPositioner = positionSpinner.bind(this, spinView, options);

		var myRemover = spinView.remove.bind(spinView);

		// Keep position and visibility updated
		this.bind('focus', myPositioner);
		// TODO: Workaround to force reflow of page for first display
		// Without this the first position will be off
		this.one('focus.pretty-spinner-workaround', myPositioner);

		this.bind('blur', function () {
			setTimeout(function () {
				if (!spinModel.get('active')) {
					spinView.$el.detach();
				}
			}, 100);
		});
		spinModel.on('change:active', function (model) {
			if (model.changed.active === false) {
				this.focus();
			}
		}.bind(this));

		return {
			liveValue: function liveValue(callback) {
				callback(spinModel.get('value'));

				spinModel.on('change:value', function (model) {
					callback(model.changed.value);
				});
			},
			updatePosition: myPositioner,
			remove: myRemover
		};
	};
}(jQuery));