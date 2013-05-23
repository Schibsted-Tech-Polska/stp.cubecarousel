/*
 * CubeCarousel v1.0
 *
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 Schibsted Tech Polska
 * Authors: Jacek Wojna, Krystian Jarmicki
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software. 
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
 * 
 */

jQuery(function ($) {
	
	// todo: make css class names customizable

	"use strict";

	/**
	 * Checks if css3 directives are supported
	 * 
	 * @private
	 * @method _supports
	 * @param {String} property name
	 * @param {Function} additional testing function for found property
	 * @return {Boolean}
	 */
	var	_supports = (function () {
			var div = document.createElement('div'), vendors = ['Khtml', 'Ms', 'O', 'Moz', 'Webkit'], len = vendors.length;
			return function (prop, test) {

				test = (typeof test === 'function') ? test : function () {
					return true;	
				};

				if (prop in div.style && test(prop)) {
					return true;
				}
				prop = prop.replace(/^[a-z]/, function (val) {
					return val.toUpperCase();
				});
				while (len) {
					if (vendors[len] + prop in div.style && test(vendors[len] + prop)) {
						return true;
					}
					len -= 1;
				}
				return false;
			};
		}()),

		/**
		 * Function.prototype.bind shim
		 * 
		 * @private
		 * @method _bind
		 * @param {Function} method to bind 
		 * @param {Object} object to bind with
		 * @return {Function} binded function
		 */
		_bind = function () {

			var	args = Array.prototype.slice.call(arguments),
				func = args.shift(),
				ctx = args.shift();

			return function () {
				return func.apply(ctx, arguments);
			};	
		},

		/**
		 * Error message wrapper
		 * 
		 * @private
		 * @method _error
		 * @param {String} msg error message
		 * @return {Undefined} binded function
		 */
		_error = function (msg) {
			if('console' in window && 'error' in window.console) {
				console.error(msg);
			}	
		},

		_transitionendEvents = 'webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd';

	/**
	CubeCarousel class

	@class CubeCarousel
	@constructor
	**/
	function CubeCarousel(options) {
		var defaults = {
				cubeContainerNode : null,
				/* preferred dimensions in px */
				dimensions : {
					width : 580,
					height : 400
				},
				render: function () { },
				dataGetter: function () { },
				autoplay : false,
				useShortestPath: true, 
				duration : 800,
				prv : {},
				pub : {}
			};

		/**
		 * User-defined options property, set during construction
		 *
		 * @private
		 * @property options
		 * @type Object
		 * @default null
		 */
		this.options = $.extend({}, defaults, options);

		/**
		 * literal object represents cube's actual rotation
		 *
		 * @private
		 * @property rotation
		 * @type Object
		 * @default {
		 * x : 0,
		 * y : 0,
		 * z : -0.5
		 * }
		 */
		this.rotation = {
			x : 0,
			y : 0,
			z : -0.5
		};

		/**
		 * cube's real dimensions in px
		 *
		 * @private
		 * @property realDimensions
		 * @type Object
		 * @default {
		 * width : null,
		 * height : null
		 * }
		 */
		this.realDimensions = {
			width : null,
			height : null
		};
		this.realDimensions = $.extend({}, this.options.dimensions);

		/**
		 * Cube's counter jQuery objects references
		 *
		 * @private
		 * @property counter
		 * @type Object
		 * @default {
		 * container: null,
		 * current: null,
		 * total: null 
		 * }
		 */
		this.counter = {
			container : null,
			current : null,
			total : null		
		};

		/**
		 * carousel controls jQuery objects references
		 *
		 * @private
		 * @property controls
		 * @type Object
		 * @default {
		 * container : null,
		 * leftControl : null,
		 * rightControl : null
		 * }
		 */
		this.controls = {
			container: null,
			left : null,
			right : null
		};

		/**
		 * main data for rendering templates
		 *
		 * @private
		 * @property data
		 * @type Array
		 * @default []
		 */
		this.data = [];

		/**
		 * indicates if the carousel is locked or it isn't
		 *
		 * @private
		 * @property locked
		 * @type Boolean
		 * @default false
		 */
		this.locked = false;

		/**
		 * indicates if browser is able to display css 3d cube and animate it
		 *
		 * @private
		 * @property useCube
		 * @type Boolean
		 * @default false
		 */
		this.useCube = false;

		/**
		 * jQuery object detached from DOM, used as a template for rendering panes 
		 *
		 * @private
		 * @property paneTemplate
		 * @type Object
		 * @default null
		 */
		this.paneTemplate = null;

		/**
		 * Data index of pane being currently in front of the carousel
		 *
		 * @private
		 * @property currentIndex
		 * @type Number
		 * @default 0
		 */
		this.currentIndex = 0;

		/**
		 * autoplay's slide timeout, runs moving cube to right
		 *
		 * @private
		 * @property autoplayTimeout
		 * @type Interval
		 * @default null
		 */
		this.autoplayTimeout = null;

		this.eventHandlers = {};

		/* initialize cube */
		this.initialize();
	}
	
	/**
	 * initializes cube carousel
	 * TODO : Need to be rewritten/refactored
	 *
	 * @private
	 * @method initialize
	 * @return {Undefined} 
	 */
	CubeCarousel.prototype.initialize = function () {

		var that = this,
			firstPane,
			perspectiveContainer,
		
			// test for css 3d transforms	
			transform3dTest = function (prop) {
					
				var div = document.createElement('div'),
					map = {
						'WebkitTransform' : '-webkit-transform',
						'OTransform' : '-o-transform',
						'msTransform' : '-ms-transform',
						'MozTransform' : '-moz-transform',
						'transform' : 'transform'
					},
					result = '';

				div.style[prop] = 'translate3d(1px, 1px, 1px)';
				document.body.appendChild(div);

				if (typeof window.getComputedStyle === 'function') {
					result = window.getComputedStyle(div).getPropertyValue(map[prop]);	
				}

				document.body.removeChild(div);
				
				return (result && result !== 'none');	
					
			},

			// test for transform-style: preserve-3d
			transformStyleTest = function (prop) {
					
				var div = document.createElement('div'),
					map = {
						'WebkitTransformStyle' : '-webkit-transform-style',
						'OTransformStyle' : '-o-transform-style',
						'msTransformStyle' : '-ms-transform-style',
						'MozTransformStyle' : '-moz-transform-style',
						'transformStyle' : 'transform-style'
					},
					result = '';

				div.style[prop] = 'preserve-3d';
				document.body.appendChild(div);

				if (typeof window.getComputedStyle === 'function') {
					result = window.getComputedStyle(div).getPropertyValue(map[prop]);	
				}

				document.body.removeChild(div);
				
				return result === 'preserve-3d';
					
			};


		/* delay initialization to make .on('init') possible after constructor call */
		setTimeout(function () {

			/* extend carousel instance with additional private methods */
			$.extend(that, that.options.prv);

			if(typeof that.options.render !== 'function') {
				_error('missing required render function');
				return;
			}
			that.renderPaneTemplate = _bind(that.options.render, that);

			that.cubeContainerNode = that.options.cubeContainerNode;
			// check if browser supports css transforms and transitions
			if (_supports('transform', transform3dTest) && _supports('transformStyle', transformStyleTest) && _supports('transition')) {
				that.useCube = true;
				that.cubeContainerNode.addClass('cube-carousel-css3');
			} else { // fallback mode - use inline list instead of cube
				that.useCube = false;
				that.cubeContainerNode.addClass('cube-carousel-no-css3');	
			}
			that.cubeContainerNode.addClass('cube-carousel-container');

			/* grab template */
			firstPane = that.cubeContainerNode.find('.cube-carousel-template').first();	
			that.paneTemplate = firstPane.clone();
			firstPane.remove();

			perspectiveContainer = $('<div class="cube-carousel-perspective-container"></div>');

			/* additional container for panes */
			that.cubeNode = $('<div class="cube-carousel-panes"></div>');
			that.cubeContainerNode.append(perspectiveContainer.append(that.cubeNode));
			that.cubeNode.bind(_transitionendEvents, function () {
				that.locked = false;
			});

			/* Resize cube if window's size changes */
			$(window).on('resize', _bind(that.handleResize, that));
			that.handleResize();

			that.trigger('init');
			that.setData(that.options.dataGetter);	
		}, 0);
		
	};

	/**
	 * Resizes cube proportionally, according to parent's width
	 *
	 * @private
	 * @method handleResize
	 * @return {Undefined} 
	 */
	CubeCarousel.prototype.handleResize = function () {

		var	parentNode = this.cubeContainerNode.parent(),
			newHeightProportion = Math.round(this.options.dimensions.height / this.options.dimensions.width * 1000) / 1000;

		if (parentNode.width() < this.options.dimensions.width) {
			this.realDimensions.width = parentNode.width();
			this.realDimensions.height = Math.round(this.realDimensions.width * newHeightProportion);
		} else if (parentNode.width() > this.realDimensions.width && this.realDimensions.width !== this.options.dimensions.width) {
			if (parentNode.width() > this.options.dimensions.width) {
				this.realDimensions.width = this.options.dimensions.width;
			} else {
				this.realDimensions.width = parentNode.width();
			}
			this.realDimensions.height = Math.round(this.realDimensions.width * newHeightProportion);
		}
		
		this.setSize(this.realDimensions);	
	};

	/**
	 * Starts carousel when data finished loading
	 *
	 * @private
	 * @method run
	 * @return {Undefined} 
	 */
	CubeCarousel.prototype.run = function () {
		
		this.initPanes();

		if(this.options.autoplay !== false) {
			this.startAutoplay();	
		}

		this.trigger('load', {
			data: this.data,
			size: this.data.length
		});
			
	};

	/**
	 * Sets cube size
	 *
	 * @private
	 * @method setSize
	 * @param {Object} dimensions A dimensions object
	 * @return {Undefined} 
	 */
	CubeCarousel.prototype.setSize = function (dimensions) {
		
		this.cubeContainerNode.css({
			width : dimensions.width,
			height : dimensions.height
		});

		this.cubeNode.css({
			fontSize : dimensions.width	
		});

		this.trigger('resize', {
			width: dimensions.width,
			height: dimensions.height
		});
	};
	
	/**
	 * Pass control to approperiate generator in order to create inital panes
	 *
	 * @private
	 * @method initPanes
	 * @return {Undefined} 
	 */
	CubeCarousel.prototype.initPanes = function () {
		
		var that = this;

		if (that.useCube) {
			that.generateCubePanes();
		} else {
			that.generateInlinePanes();	
		}

	};

	/**
	 * Generating cube panes 
	 * Three walls are generated - front, left and right, which are respecitvely last, first and second items of data collection 
	 *
	 * @private
	 * @method generateCubePanes
	 * @return {Undefined}
	 */
	CubeCarousel.prototype.generateCubePanes = function () {

		var	middle = this.currentIndex,
			indexes = [-1, 0, 1],
			classMap = {
				'-1' : 'cube-carousel-left',
				'0' : 'cube-carousel-front',
				'1' : 'cube-carousel-right'	
			},
			dataObject,
			currentPane,
			i;

		// flush cube
		this.cubeNode.empty();

		for(i = 0; i < indexes.length; i++) {
			dataObject = this.data[this.dataIndexOffset(this.currentIndex + indexes[i])];
			currentPane = this.renderPaneTemplate(dataObject, this.paneTemplate.clone(), this.dataIndexOffset(this.currentIndex + indexes[i]));
			this.cubeNode.append(currentPane);
			currentPane.addClass(classMap[indexes[i]]);
		}
	};

	/**
	 * Generating inline panes
	 * Five panes are generated, wchich are respecitvely second last, last, first, second and third items of data collections 
	 *
	 * @private
	 * @method generateInlinePanes
	 * @return {Undefined}
	 */
	CubeCarousel.prototype.generateInlinePanes = function () {

		var	middle = this.currentIndex,
			indexes = [-2, -1, 0, 1, 2],
			dataObject,
			currentPane,
			i;

		this.cubeNode.empty();

		for(i = 0; i < indexes.length; i++) {
			dataObject = this.data[this.dataIndexOffset(this.currentIndex + indexes[i])];
			currentPane = this.renderPaneTemplate(dataObject, this.paneTemplate.clone(), this.dataIndexOffset(this.currentIndex + indexes[i]));
			this.cubeNode.append(currentPane);
		}

	};

	/**
	 * Facade method for moving carousel elements to the right, can be used as a event handler or standalone 
	 *
	 * @public
	 * @method moveRight
	 * @param {Function} callback function to be called when move finishes
	 * @return {Boolean} false
	 */
	CubeCarousel.prototype.moveRight = function (callback) {

		if (!this.isLocked()) {
			this.locked = true;	
			this.stopAutoplay();
			
			this.trigger('beforemove', {
				index: this.currentIndex,
				direction: 'right',
				data: this.data[this.currentIndex]
			});

			if (this.useCube) {
				this.moveSidesRight(callback);
			} else {
				this.moveInlineRight(callback);
			}
			this.setCurrentIndex(this.currentIndex + 1);
		}

		return false;	
	};

	/**
	 * Facade method for moving carousel elements to the left, can be used as a event handler or standalone 
	 *
	 * @public
	 * @method moveLeft
	 * @param {Function} callback function to be called when move finishes
	 * @return {Boolean} false
	 */
	CubeCarousel.prototype.moveLeft = function (callback) {
		
		if (!this.isLocked()) {
			this.locked = true;	
			this.stopAutoplay();

			this.trigger('beforemove', {
				index: this.currentIndex,
				direction: 'left',
				data: this.data[this.currentIndex]
			});
			
			if (this.useCube) {
				this.moveSidesLeft(callback);
			} else {
				this.moveInlineLeft(callback);	
			}

			this.setCurrentIndex(this.currentIndex - 1);
		}
		
		return false;	
	};

	/**
	 * Method for moving cube to the right 
	 * After rotation, first element of cube (old left side) is removed, then front becomes left, right becomes front and new left is rendered 
	 * Also, next left pane is preloaded 
	 *
	 * @private
	 * @method moveSidesRight
	 * @param {Function} callback function to be called when move finishes
	 * @return {Undefined} 
	 */
	CubeCarousel.prototype.moveSidesRight = function (callback) {
	
		var that = this;

		this.rotate({
			x: 0,
			y: -90,
			z: 0		
		},
		{
			duration: this.options.duration,
			complete: function () {
		
				var newPane;
				
				// switch classes for panes accordingly to new cube rotation	
				that.cubeNode.find('.cube-carousel-left').remove();
				that.cubeNode.find('.cube-carousel-front').removeClass('cube-carousel-front').addClass('cube-carousel-left');
				that.cubeNode.find('.cube-carousel-right').removeClass('cube-carousel-right').addClass('cube-carousel-front');

				// new right pane
				newPane = that.renderPaneTemplate(that.data[that.dataIndexOffset(that.currentIndex + 1)], that.paneTemplate.clone(), that.dataIndexOffset(that.currentIndex + 1));
				newPane.addClass('cube-carousel-right');
				that.cubeNode.append(newPane);

				// reset cube state
				that.rotate({
					x: 0,
					y: 90,
					z: 0
				});
					
				that.locked = false;

				that.trigger('aftermove', {
					newPane: newPane,
					index: that.currentIndex,
					direction: 'right',
					data: that.data[that.currentIndex]	
				});

				if(typeof callback === 'function') {
					callback.call(this);
				}
			}	
		});
			
	};
	
	/**
	 * Method for moving cube to the left 
	 * After rotation, first element of cube (old right side) is removed, then front becomes right, left becomes front and new right is rendered 
	 * Also, next right pane is preloaded 
	 *
	 * @private
	 * @method moveSidesLeft
	 * @param {Function} callback function to be called when move finishes
	 * @return {Undefined} 
	 */
	CubeCarousel.prototype.moveSidesLeft = function (callback) {
	
		var that = this;
		
		this.rotate({
			x: 0,
			y: 90,
			z: 0		
		},
		{
			duration: this.options.duration,
			complete: function () {
	
				var newPane;	
				
				// switch classes for panes accordingly to new cube rotation		
				that.cubeNode.find('.cube-carousel-right').remove();

				that.cubeNode.find('.cube-carousel-front').removeClass('cube-carousel-front').addClass('cube-carousel-right');
				that.cubeNode.find('.cube-carousel-left').removeClass('cube-carousel-left').addClass('cube-carousel-front');

				// new left pane	
				newPane = that.renderPaneTemplate(that.data[that.dataIndexOffset(that.currentIndex - 1)], that.paneTemplate.clone(), that.dataIndexOffset(that.currentIndex - 1));
				newPane.addClass('cube-carousel-left');
				that.cubeNode.prepend(newPane);

				// reset cube state
				that.rotate({
					x: 0,
					y: -90,
					z: 0
				});
				
				that.locked = false;

				that.trigger('aftermove', {
					newPane: newPane,
					index: that.currentIndex,
					direction: 'left',
					data: that.data[that.currentIndex]
				});

				if(typeof callback === 'function') {
					callback.call(this);
				}
			}	
		});
			
	};

	/**
	 * Method for moving inline list to right 
	 * It animates list one step to the right, then removes first element, renders next one and appends it    
	 * 
	 * @private
	 * @method moveInlineRight
	 * @param {Function} callback function to be called when move finishes
	 * @return {Undefined} 
	 */
	CubeCarousel.prototype.moveInlineRight = function (callback) {

		var that = this;

		this.cubeNode.animate(
		{
			left: '-3em' // animate one step right
		},
		{
			duration: this.options.duration,
			complete: function () {

				var newPane;
			
				// render and append new pane	
				newPane = that.renderPaneTemplate(that.data[that.dataIndexOffset(that.currentIndex + 2)], that.paneTemplate.clone(), that.dataIndexOffset(that.currentIndex + 2));

				that.cubeNode.children().first().remove();
				that.cubeNode.append(newPane);
	
				// reset list state (swap back to where it was before animation with new slides)
				that.cubeNode.css('left', '-2em');
				
				that.locked = false;

				that.trigger('aftermove', {
					newPane: newPane,
					index: that.currentIndex,
					direction: 'right',
					data: that.data[that.currentIndex]
				});

				if(typeof callback === 'function') {
					callback.call(this);
				}
			}
		});


	};

	/**
	 * Method for moving inline list to left 
	 * It animates list one step to the left, then removes last element, renders next one and prepends it    
	 * 
	 * @private
	 * @method moveInlineLeft
	 * @param {Function} callback function to be called when move finishes
	 * @return {Undefined} 
	 */
	CubeCarousel.prototype.moveInlineLeft = function (callback) {

		var that = this;

		this.cubeNode.animate(
		{
			left: '-1em' // animate one step left 
		},
		{
			duration: this.options.duration,
			complete: function () {

				var newPane;
				
				newPane = that.renderPaneTemplate(that.data[that.dataIndexOffset(that.currentIndex - 2)], that.paneTemplate.clone(), that.dataIndexOffset(that.currentIndex - 2));

				that.cubeNode.children().last().remove();
				that.cubeNode.prepend(newPane);
				that.cubeNode.css('left', '-2em');

				that.locked = false;

				that.trigger('aftermove', {
					newPane: newPane,
					index: that.currentIndex,
					direction: 'left',
					data: that.data[that.currentIndex]
				});

				if(typeof callback === 'function') {
					callback.call(this);
				}
			}
		});
		
	};

	/**
	 * Goes to element specified by index (starting with 0)
	 *
	 * @public
	 * @method moveTo
	 * @param {Number} index Value of target index 
	 * @param {Function} callback Callback to be called when cube moved to specified index
	 * @return {Undefined}
	 */
	CubeCarousel.prototype.moveTo = function (index, callback) {

		var	direction,
			that = this;

		index = parseInt(index, 10);
	
		if(this.currentIndex !== index) {

			index = this.dataIndexOffset(index);

			if(this.options.useShortestPath) {
				if(this.currentIndex < index) {
					if((this.data.length / 2) >= index - this.currentIndex) {
						direction = 'Right';		
					} else {
						direction = 'Left';	
					}
				} else {
					if((this.data.length / 2) >= this.currentIndex - index) {
						direction = 'Left';
					} else {
						direction = 'Right';
					}
				}
			} else {
				direction = (this.currentIndex < index)	? 'Right' : 'Left';	
			}
			

			this['move' + direction](function () {
				setTimeout(function () {
					that.moveTo(index);
				}, 0);
			});
		} else if(typeof callback === 'function') {
			callback.call(this);
		}

	};

	/**
	 * Sets index of currently visible pane (front of the cube or list element)
	 * See also: dataIndexOffset
	 *
	 * @private
	 * @method setCurrentIndex
	 * @param {Number} candidate Value of index that is requested to be set 
	 * @return {Undefined}
	 */

	CubeCarousel.prototype.setCurrentIndex = function (candidate) {
		
		this.currentIndex = this.dataIndexOffset(candidate);

	};

	/**
	 * Calculates index relative to data length in order to help with infinite scrolling
	 * Let's say data.length === 10, then if requested index is 12 it's actually 2
	 * 
	 * @private
	 * @method dataIndexOffset
	 * @param {Number} candidate Value of index that is to be checked against actual data length
	 * @return {Number} Actual index value for given candidate  
	 */
	CubeCarousel.prototype.dataIndexOffset = function (candidate) {

		if (candidate > this.data.length - 1) {
			return this.dataIndexOffset(candidate - this.data.length);
		} else if (candidate < 0) {
			return this.dataIndexOffset(candidate + this.data.length);
		}
		
		return candidate;	
	};

	/**
	 * Simple conversion from integer miliseconds to css seconds string
	 *
	 * @private
	 * @method ms2s
	 * @param {Number} miliseconds Amount of miliseconds to be converted
	 * @return {String} Converted string
	 */
	CubeCarousel.prototype.ms2s = function (miliseconds) {
		return miliseconds / 1000 + 's';	
	};

	/**
	 * Rotates cube
	 *
	 * @private
	 * @method rotate
	 * @param {Object} directions A directions object contains three dimensional vector
	 * @param {Function} params A list of params, namely: duration of rotate animation and callback triggered on animation end
	 * @return {Undefined} 
	 */
	CubeCarousel.prototype.rotate = function (directions, params) {
	
		var that = this,
			defaultDirections = {
				x : 0,
				y : 0,
				z : 0
			},
			defaultParams = {
				duration: 0	
			};

		/* Overwrite default options */
		directions = $.extend({}, defaultDirections, directions);
		params = $.extend({}, defaultParams, params);

		this.rotation = {
			x : this.rotation.x + directions.x,
			y : this.rotation.y + directions.y,
			z : this.rotation.z + directions.z
		};

		this.cubeNode.css({
			'-webkit-transition': '-webkit-transform ' + this.ms2s(params.duration),
			'-moz-transition': '-moz-transform ' + this.ms2s(params.duration),
			'-o-transition': '-o-transform ' + this.ms2s(params.duration),
			'-ms-transition': '-ms-transform ' + this.ms2s(params.duration),
			'transition': 'transform ' + this.ms2s(params.duration),
				
			'-webkit-transform': 'translateZ( ' + this.rotation.z + 'em ) rotateY( ' + this.rotation.y + 'deg ) rotateX( ' + this.rotation.x + 'deg )',
			'-moz-transform': 'translateZ( ' + this.rotation.z + 'em ) rotateY( ' + this.rotation.y + 'deg ) rotateX( ' + this.rotation.x + 'deg )',
			'-o-transform': 'translateZ( ' + this.rotation.z + 'em ) rotateY( ' + this.rotation.y + 'deg ) rotateX( ' + this.rotation.x + 'deg )',
			'transform': 'translateZ( ' + this.rotation.z + 'em ) rotateY( ' + this.rotation.y + 'deg ) rotateX( ' + this.rotation.x + 'deg )'
		});

		this.cubeNode.one(_transitionendEvents, function () {

			// after transition ends
			// remove transition 
			that.cubeNode.css({
				'-webkit-transition': 'none',
				'-moz-transition': 'none',
				'-o-transition': 'none',
				'-ms-transition': 'none',
				'transition': 'none'
			});
			
			that.locked = false;

			if(typeof params.complete === 'function') {
				params.complete.call(that);
			}
		});
		

	};

	/**
	 * Clears old autoplay (if exists) and starts new one
	 * 
	 * @public
	 * @method startAutoplay
	 * @return {Undefined}
	 */
	CubeCarousel.prototype.startAutoplay = function () {

		var that = this;

		if (!this.isLocked() && this.options.autoplay !== false) {

			if (this.autoplayTimeout !== null) {
				clearTimeout(this.autoplayTimeout);
			}

			this.autoplayTimeout = setTimeout(function () {
				that.moveRight(function() {
					that.startAutoplay();
				});
			}, this.options.autoplay);

		}
	};

	/**
	 * Stops autoplay
	 * 
	 * @public
	 * @method stopAutoplay
	 * @return {Undefined}
	 */
	CubeCarousel.prototype.stopAutoplay = function () {
		if (this.options.autoplay !== false && this.autoplayTimeout !== null) {
			clearTimeout(this.autoplayTimeout);
			this.autoplayTimeout = null;
		}
	};

	/**
	 * Checker method determining if carousel is locked
	 * 
	 * @public
	 * @method isLocked
	 * @return {Boolean}
	 */
	CubeCarousel.prototype.isLocked = function () {
		return this.locked;
	};

	/**
	 * Method to lock carousel (prevent from moving panes)
	 * 
	 * @public
	 * @method lock
	 * @return {Undefined}
	 */
	CubeCarousel.prototype.lock = function () {
		this.locked = true;
	};

	/**
	 * Method to unlock carousel (allow panes to move)
	 * 
	 * @public
	 * @method unlock
	 * @return {Undefined}
	 */
	CubeCarousel.prototype.unlock = function () {
		this.locked = false;
	};

	/**
	 * Attachmed of an event handler to an event
	 * 
	 * @public
	 * @method on 
	 * @param {String} eventName name of an event to be observed
	 * @param {Function} handler event handler
	 * @return {Undefined}
	 */
	CubeCarousel.prototype.on = function (eventName, handler) {
		
		if(Object.prototype.toString.call(this.eventHandlers[eventName]) !== '[object Array]') {
			this.eventHandlers[eventName] = [];
		}
		this.eventHandlers[eventName].push(handler);
			
	};

	/**
	 * Detachmend of an event handler from an event
	 * 
	 * @public
	 * @method off 
	 * @param {String} eventName name of an event to be observed
	 * @param {Function} handler event handler
	 * @return {Undefined}
	 */
	CubeCarousel.prototype.off = function (eventName, handler) {
		
		var i;

		if(Object.prototype.toString.call(this.eventHandlers[eventName]) === '[object Array]') {
			for(i = 0; i < this.eventHandlers[eventName].length; i++) {
				if(this.eventHandlers[eventName][i] === handler) {
					this.eventHandlers[eventName].splice(i, 1);
					i--;
				}
			}
		}
	};

	/**
	 * Triggering specified event
	 * 
	 * @public
	 * @method trigger 
	 * @param {String} eventName name of an event to be triggered
	 * @param {Object} data data to be passed to event handler
	 * @return {Undefined}
	 */
	CubeCarousel.prototype.trigger = function (eventName, data) {

		var i;
		
		if(Object.prototype.toString.call(this.eventHandlers[eventName]) === '[object Array]') { 
			for(i = 0; i < this.eventHandlers[eventName].length; i++) {
				this.eventHandlers[eventName][i].call(this, data);
			}
		}
	};
	
	/**
	 * Sets data, based on getter function wchich either returns an array or a promise-like object
	 * 
	 * @private
	 * @method setData
	 * @param {Object} getterFunc function that returns data array or an object with .done() method (most likely a promise)
	 * @return {Undefined}
	 */
	CubeCarousel.prototype.setData = function (getterFunc) {
		
		var	result = getterFunc.call(this),
			that = this;

		if (Object.prototype.toString.call(result) === '[object Array]') {
			this.data = result;
			this.run();		
		} else if ('done' in result) {
			result.done(function (data) {
				that.data = data;
				that.run();	
			});	
		} else {
			_error('data source is not an array and does not implement promise interface');

		}
	};

	// jQuery hook
	$.fn.cubeCarousel = function (params) {
		
		var prop,
			instance,
			publish;

		if(!params.cubeContainerNode) {
			params.cubeContainerNode = this;	
		}

		instance = new CubeCarousel(params);
	
		// public interface	
		publish = {	
			moveLeft: _bind(instance.moveLeft, instance),
			moveRight: _bind(instance.moveRight, instance),
			moveTo: _bind(instance.moveTo, instance),
			startAutoplay: _bind(instance.startAutoplay, instance),
			stopAutoplay: _bind(instance.stopAutoplay, instance),
			lock: _bind(instance.lock, instance),
			unlock: _bind(instance.unlock, instance),
			isLocked: _bind(instance.isLocked, instance),
			on: _bind(instance.on, instance),
			off: _bind(instance.off, instance),
			trigger: _bind(instance.trigger, instance)
		};

		// additional public methods
		if(typeof params.pub === 'object') {
			for(prop in params.pub) {
				if(params.pub.hasOwnProperty(prop)) {
					
					if(typeof params.pub[prop] === 'function') {
						publish[prop] = _bind(params.pub[prop], instance);	
					} else {
						publish[prop] = params.pub[prop];	
					}
			
				}	
			}	
		}
		
		return publish;

	};

});
