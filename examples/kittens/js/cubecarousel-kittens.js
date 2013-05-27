jQuery(function ($) {
  
  'use strict';

  var extensions = {

    dimensions : {
      width : 580,
      height : 400
    },
  
    // promise for data
    dataGetter: function () {
    
      var  that = this;
  
      return  $.ajax({
            url: 'examples/kittens/mocks/grab-ids.json',
            dataType: 'json'
          })
            .then(function (data) {
              return $.ajax({
                url: 'examples/kittens/mocks/grab-data.json',
                dataType: 'json'
              })
                .then(function (data) {
                  return data;
              });
            });
    },

    // renderer function for single pane 
    render: function (currentDataObject, currentPane) {

      if (currentDataObject.imgUrl) {
        currentPane.find('.main-img').attr('data-src', currentDataObject.imgUrl);
      }

      if (currentDataObject.title) {
        currentPane.find('.title').text(currentDataObject.title);
      }

      currentPane.find('.lorem').text('sit');
      currentPane.find('.ipsum').text('dolor');
      currentPane.find('.dolor').text('ipsum');
      currentPane.find('.sit').text('lorem');

      this.loadAndShow(currentPane);
        
      return currentPane;  
    },

    // additional private properties and method
    prv: {
      
      // counter elements references
      counter: {
        container : null,
        current : null,
        total : null    
      },

      // creation of control arrows
      buildControls: function () {
  
        var that = this,
          container,
          left,
          right;

        
        container = this.options.cubeContainerNode.find('.controls');
        left = container.find('.left');
        right = container.find('.right');

        left.click(function () {
          that.moveLeft();
          return false;
        });
        right.click(function () {
          that.moveRight();

          return false;
        });

        var counter = 0;

        window.Hammer(this.options.cubeContainerNode[0])
          .on('dragend', function (e) {
            
            if(e && e.gesture && e.gesture.direction && e.gesture.pointerType === 'touch') {
              if(e.gesture.direction === 'left') {
                that.moveRight();  
              } else if(e.gesture.direction === 'right') {
                that.moveLeft();
              }

            }

          });

        container.show();


      },

      // initialize image loading for a pane
      loadAndShow: function (pane) {
  
        if (pane) {    
          pane.removeClass('hidden');
          this.loadImage(pane.find('.main-img'), function () {
            pane.find('.preloader').removeClass('preloader');
          });
        }
      },

      // loading image with callback
      loadImage: function (img, fn) {

        var dataSRC = img.attr('data-src');

        img.on('load', function () {
          if (fn) {
            fn();
          }
        });

        if (dataSRC) {
          img.attr('src', dataSRC);
          img.removeAttr('data-src');
        }
      },

      // initialization of counter
      initCounter: function () {
    
        this.counter.container = this.cubeContainerNode.find('.counter');
        this.counter.current = this.counter.container.find('.counter-current');
        this.counter.total = this.counter.container.find('.counter-total');

        this.counter.container.show();
        this.counter.current.html(this.currentIndex + 1);
        this.counter.total.html('.counter-total').html(this.data.length);  
          
      },
      
    }
  };

  // new carousel instance
  var carousel = $('.kittens-cube').cubeCarousel(extensions);

  // on initialize, build controls and indicate loading state for cube
  carousel.on('init', function () {
    this.cubeNode.addClass('main-loader');
  });  

  // when data is recieved, remove loading state from cube, init counter and attach xt for links
  carousel.on('load', function (e) {

    var that = this;
  
    this.buildControls();  
    this.cubeNode.removeClass('main-loader');

    this.cubeContainerNode.on('mouseenter', function () {
      that.stopAutoplay();
    });
    this.cubeContainerNode.on('mouseleave', function () {
      that.startAutoplay();
    });
    
    this.initCounter();
  });

  // after move set counter and preload next element
  carousel.on('aftermove', function (e) {
    this.counter.current.html(e.index + 1);
    
    if(this.useCube) {
      if(e.direction === 'left') {
        this.loadAndShow(this.renderPaneTemplate(this.data[this.dataIndexOffset(e.index - 2)], this.paneTemplate.clone()));
      } else {
        this.loadAndShow(this.renderPaneTemplate(this.data[this.dataIndexOffset(e.index + 2)], this.paneTemplate.clone()));
      }
    }
  });

});
