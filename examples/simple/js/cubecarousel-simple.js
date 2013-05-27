jQuery(function ($) {
  
  'use strict';

  var extensions = {

    dimensions : {
      width : 580,
      height : 400
    },
  
    // array of data
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
    render: function (currentDataObject, currentPane, index) {
        
      currentPane.find('.cube-carousel-content')
        .addClass('simple-cube-content-' + index)
        .text(currentDataObject.content);
        
      return currentPane;  
    },

    // additional private properties and method
    prv: {
    

      // logic for control dots
      buildControls: function () {
        
        var that = this;

        $('.simple-cube-controls').on('click', 'a', function () {
        
          var targetIndex = parseInt($(this).text(), 10) - 1;

          if(!that.isLocked() && !$(this).hasClass('active')) {
            that.moveTo(targetIndex);
            $(this).parent('li').parent('ul').find('a.active').removeClass('active');
            $(this).addClass('active');  
          }

          return false;
        });
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


});
