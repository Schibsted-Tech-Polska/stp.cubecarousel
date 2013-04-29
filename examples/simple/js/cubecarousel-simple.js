jQuery(function ($) {
	
	'use strict';

	var extensions = {

		dimensions : {
			width : 580,
			height : 400
		},
	
		// promise for data
		dataGetter: function () {
		
			return [
				{
					'content': 'Side 1'
				},
				{
					'content': 'Side 2'
				},
				{
					'content': 'Side 3'
				},
				{
					'content': 'Side 4'
				}
			];
		},

		// renderer function for single pane 
		render: function (currentDataObject, currentPane) {
				
			currentPane.find('.content').text(currentDataObject.content);
				
			return currentPane;	
		},

		// additional private properties and method
		prv: {
		

			// creation of control arrows
			buildControls: function () {

			},

		}
	};

	// new carousel instance
	var carousel = $('.simple-cube').cubeCarousel(extensions);

	// when data is recieved, remove loading state from cube, init counter and attach xt for links
	carousel.on('load', function (e) {

		var that = this;
	
		this.buildControls();	
	});

	carousel.on('aftermove', function (e) {
		
	});

});
