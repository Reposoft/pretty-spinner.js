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

		/**
		 * Direction determines which arrow and positioning offset from the element.
		 * Highly optimized to work with Repos Visual Planner for positioning
		 */
		className: function () {
			return 'pretty-spinner arrow_box ' + this.options.direction;
		},

		template: _.template('<input type="text" class="pretty-spinner-keyboard-input hidden" />'),

		/**
		 * Setup initial value for the wheel and initialize
		 * Hammer plugin for propert touch events. Also fills the wheel with numbers.
		 */
		initialize: function (options) {
			this.value = window.isNaN(options.default) ? 0 : options.default;
			this.model.set('value', this.value);

			this.$el.hammer(_.defaults(options, {
				drag_min_distance: 1
			}));

			// Listen to global keyboard events
			this.$el.append(this.template({ value: this.value }));
			$(document).on('keydown.prettyspinner', this.keydownHook.bind(this));
			$(document).on('keydown.prettyspinner', this.keyupHook.bind(this));

			this.listenTo(this.model, 'change:active', function (model) {
				if (!model.changed.active) {
					this.$('.pretty-spinner-keyboard-input').addClass('hidden');
				}
			});

			this.fillWheel();
		},

		/**
		 * Accepted directions are top right bottom and left
		 */
		setDirection: function (direction) {
			this.$el.removeClass('top right bottom left');
			this.$el.addClass(direction);
		},

		/**
		 * Fills the view with numbers ranging from min to max
		 */
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

		/**
		 * Tries to center the number element that matches
		 * the actual value the wheel has spun to.
		 */
		render: function () {
			// Height of each number in the wheel
			var numberHeight = this.options.spinNumberHeight;

			// We assume two number's initial offset from actual value
			var startOffset = 2 * numberHeight;

			// Use margin to actually spin the wheel
			var margin = (-this.value * numberHeight) / this.options.step;
			this.$('.pretty-spinner-wheel:first-child').css('margin-top', margin + startOffset);

			return this;
		},

		/**
		 * Rounds the number to the closest factorial of specified step between
		 * each number in the wheel.
		 */
		roundValue: function () {
			return Math.round(this.value / this.options.step) * this.options.step;
		},

		events: {
			// Hook on the actual spinning
			'dragup': 'spin',
			'dragdown': 'spin',

			// To help us know if the wheel is in use by the end-user
			'touch': 'setActive',
			'release': 'clearActive',

			// Prevents lost focus on click
			'click': 'clickSteal'
		},

		keydownHook: function () {
			// If neither our target nor any of our own elements are in focus we have nothing to do here
			if (!this.model.get('$target').is(':focus') && !this.$el.add(this.$el.children()).is(':focus')) { return; }
			this.model.set('active', true);
			this.model.set('lastKeyPress', moment());
			this.$('.pretty-spinner-keyboard-input').removeClass('hidden');

			this.$('.pretty-spinner-keyboard-input').focus();

			setTimeout(function () {
				var inputVal = +$('.pretty-spinner-keyboard-input').val();

				this.value = _.isNumber(inputVal) ? inputVal : this.value;
				this.model.set('value', (this.value = this.roundValue()));
				this.render();
			}.bind(this), 1);

			// return false;
		},

		keyupHook: function () {
			setTimeout(function () {
				if (moment().diff(this.model.get('lastKeyPress')) > 2500) {	this.clearActive(); }
			}.bind(this), 2500);
		},

		setActive: function () {
			this.model.set({
				active: true,
			});
		},

		clearActive: function () {
			this.model.set({
				value: (this.value = this.roundValue()),
				active: false
			});

			this.$('.pretty-spinner-keyboard-input').val('');

			this.render();
		},

		clickSteal: function () {
			return false;
		},

		spin: function (e) {
			// Update temporary value
			this.value = this.model.get('value') - e.gesture.deltaY * this.options.speed;

			// Validate it
			this.value = Math.max(this.options.min, Math.min(this.options.max, this.value));

			// Update the view
			this.render();
		},

		remove: function () {
			$(document).off('keyup.prettyspinner');
			$(document).off('keydown.prettyspinner');
			Backbone.View.prototype.remove.apply(this, arguments);
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
			} else if (offset.top - spinView.$el.height() - 5 < 0) {
				options.direction = 'bottom';
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
		direction: 'right',
		speed: (1 / 27),

		// View defaults, might be tightly coupled with CSS as well
		spinNumberHeight: 30
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

		var myRemover = function () {
			spinView.remove();
			this.unbind('focus', myPositioner);
			this.unbind('blur', myDetacher);
			spinModel.off('change');
		}.bind(this);

		var myDetacher = function () {
			setTimeout(function () {
				if (!spinModel.get('active')) {
					spinView.$el.detach();
				}
			}, 100);
		};

		// Keep position and visibility updated
		this.bind('focus', myPositioner);
		// TODO: Workaround to force reflow of page for first display
		// Without this the first position will be off
		this.one('focus.pretty-spinner-workaround', myPositioner);

		this.bind('blur', myDetacher);

		// Focus the element once the wheel has stopped
		spinModel.on('change:active', function (model) {
			if (model.changed.active === false) {
				this.focus();
			}
		}.bind(this));

		spinModel.set('$target', this);

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