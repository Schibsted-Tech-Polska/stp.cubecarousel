# Customizable and responsive cube carousel

Main goal behind this carousel plugin was to make it flexible and easy to customize. This is accomplished by allowing developer to extend carousel core during initialization as well as requiring him or her to provide custom data retrieval and rendering functions.

## Overview

During initialization, you have to privide at least data getter function and rendering function. When data array is grabbed, carousel will render itself, for example:
```html
<div class="cube">
	<div class="cube-carousel-template">
		<div class="cube-carousel-content">
			<h1></h1>
		</div>
	</div>
</div>
```
```javascript
var cube = $('.cube').cubeCarousel({
	dataGetter: function() {
		return [{
			title: 'Item one'
		},
		{
			title: 'Item two'	
		}];
	},

	render: function(data, template) {
		template.find('h1').html(data.title);

		return template;
	}
});
```

This is the bare minimum you have to do to setup the carousel. There are no control options so this cube will just sit still, but you can create your own controls easily with help of ```cube.moveTo(Number)```, ```cube.moveRight()``` and ```cube.moveLeft()``` methods. More on that later.




### Data getter

You can grab data from whatever source you want using dataGetter function. The only requirement is **that function has to return either an array or promise that will eventually be resolved as an array**.

#### Array example:

```javascript
dataGetter: function() {
	var container = $('.data-container'),
		data = [];
	
	container.each(function() {
		data.push($(this).data('title'));	
	});

	return data;
}
```

This example assumes that there is a DOM element which has class "data-container" and each of it's children has data-title attribute. Function builds a data array from those elements and then returns it instantly.

#### Promise example:

```javascript
dataGetter: function() {
	return $.ajax({
		url: 'first-step-server'	
	}).then(function(someUrl) {
		return $.ajax({
			url: someUrl,
			type: 'json'	
		}).then(data) {
			return data.items;	
		}
	});
}
```

This example assumes that there is some middle host providing final destination url and then array of items is stored in "items" property of JSON response. Of course this is not the only possible scenario. There's no limit to middle hosts (there can be none as well) as long as you return promise that will resolve in an array.


### Render function 

Whenever cube side is rendered, render function is being called. This function is called with three parameters: data for current pane, copy of pane template and index number of this particular data element in data array. You can do whatever you want inside this function (ie. decorate template with text and events), only requirement is **it must return pane template**.

#### Example: 

```javascript
render: function(data, template, index) {
	
	template.find('.title').text(data.title);
	template.find('.pane-number').data('index', index);
	
	template.on('click', function() {
		var index = $(this).find('.pane-number');
		if(index %2 === 0) {
			window.openDialog('fizz!');	
		}
		else {
			window.openDialog('buzz!')	
		}
	});

	return template;
		
}
````

This example decorates current pane with title provided by data array and attaches event handler which is executes when user clicks a pane (note: for performace reasons you might want to consider attaching event handler on parent cube node and using event delegation).

## Remaining initialization options

##### dimensions
Object with two numeric values, "width" and "height", specifies maximal width for carousel and height based on which proportion will be calculated during resize.
Default: 
```javascript 
{
	width: 580,
	height: 400	
}
```
 
##### autoplay
Specifies wether cube should be automatically rotating. Possible values: false for prevention of autoplay or number of miliseconds indicating autoplay interval.
Default: ```false```

##### useShortestPath
Specifies wether moveTo() method should use shortest path to get into target pane or follow direction regardless if it's a shortest path.
Consider case: current pane is 1, last pane is 4, we're moving to pane 4. When this option is set to true, cube will instantly go from 1 to 4. When it's set to false, it will go all the way through panes 2, 3, and then 4.
Default: ```true```

##### duration
SPecifies time in miliseconds that it takes to move from one side to another.
Default: ```800```

##### prv
Object containing properties that will be set as private for current carousel instance. They will be available through "this" variable inside carousel methods, but not as instance's public properties.
Default: ```{}```

##### pub
Object containing properties that will be set as public for current carousel instance. They will be available through both "this" variable inside carousel methods and as instance's public properties.
Default: ```{}```


### Events

Cube emits various events that can be handled. You can specify multiple event handlers for a single event. Object "this" inside event handlers for those events is private cube instance, meaning that private methods and properties are available for them. Additional, event data object is passed into handler as a first parameter.

Attachment of event handlers: ```cubeInstance.on('eventName', handler);```

Detachment of event handlers: ```cubeInstance.off('eventName', handler);```

#### Built-in events

##### 'init':
Fired when cube DOM has been built, but no data has been retrieved yet.
Data object: 
```javascript
undefined.
```

##### 'resize' 
Fired when cube adjusts itself to size of parent container.
Data object: 
```javascript
{
	width: {Number},
	height: {Number}	
};
```

##### 'load'
Fired when data has been retrieved and carousel is ready to use.
Data object:
```javascript
{
	data: {Object}, // retrieved data 
	size: {Number} // number of items in retrieved data 
};
```

##### 'beforemove'
Fired before cube pane moves 
Data object:
```javascript
{
	index: {Number}, // current data index
	direction: {String}, // either "left" or "right",
	data: {Object} // current data element		
};
```

##### 'aftermove'
Fired after cube pane moves 
Data object:
```javascript 
{
	index: {Number}, // current data index
	direction: {String}, // either "left" or "right",
	data: {Object} // current data element		
};
```

### Custom events

You can define your own events and then trigger them yourself, optionally with data object:

```javascript
cubeInstance.on('myevent', handler);
...
cubeInstance.trigger('myevent', {prop: 'value'});
```

## Public methods:

##### moveTo(Number, Function)
Moves cube to specified index
```javascript
{Number} data index specifying where to move, starting with 0
{Function} callback called when the move is done
```

##### moveRight(Function)
Moves cube one step right
```javascript
{Function} callback called when the move is done
```

##### moveLeft(Function)
Moves cube one step left
```javascript
{Function} callback called when the move is done
```

##### startAutoplay()
Starts autoplay countdown. If autoplay option was correctly provided as a number, this method will reset 
previous autoplay countdown (if there is any) and start new one

##### stopAutoplay()
Stops autoplay 

##### lock()
Use this method if you'd like to prevent any movement of carousel

##### unlock()
Cancels carlousel lock 

##### isLocked()
Returns boolean value indicating wether carousel is locked or not 

## Demos
Example carousels are available [here](http://schibsted-tech-polska.github.io/stp.cubecarousel/ "Examples").
