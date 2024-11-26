"use strict";
/*
Ace Attorney Online - Form elements related to pointing area.

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_form_area',
	dependencies : ['form_elements', 'form_select', 'events', 'trial_data', 'language'],
	init : function() {
		registerFormElementGenerator('area_shape_type', createShapeTypeSelect);
		registerFormElementGenerator('area_coords', createCoordsPicker);
		registerFormElementGenerator('area_descriptor', createAreaSelect);
		registerFormElementGenerator('object_descriptor', createObjectSelect);
	}
}));

//INDEPENDENT INSTRUCTIONS

function createShapeTypeSelect()
{
	var types = new Array();
	
	types.push(new Object({
		type: SELECT_OPTION,
		lang: 'shape_rect',
		value: 'rect'
	}));
	types.push(new Object({
		type: SELECT_OPTION,
		lang: 'shape_circle',
		value: 'circle'
	}));
	types.push(new Object({
		type: SELECT_OPTION,
		lang: 'shape_poly',
		value: 'poly'
	}));
	
	return createSelect(types);
}

function createCoordsPicker(parameters)
{
	var element = document.createElement('span');
	addClass(element, 'coords-picker');
			
	element.setAttribute('tabindex', 0);
	element.setAttribute('value', 'rect:0,0,0,0');
	
	var button = document.createElement('button');
	button.setAttribute('data-locale-content', 'set_coords');
	translateNode(button);
	element.appendChild(button);
	
	var label = document.createElement('span');
	element.appendChild(label);
	
	element.canBe = function(test_value)
	{
		if(!is_scalar(test_value) || !test_value.toString().match(/^(rect|circle|poly):(\d+,)*\d+$/))
		{
			return false;
		}
		
		test_value = test_value.toString().split(':');
		
		var shape = test_value[0];
		var coords = test_value[1].split(',');
		
		switch(shape)
		{
			case 'rect':
				return (coords.length == 4);
				break;
			
			case 'circle':
				return (coords.length == 3);
				break;
			
			case 'poly':
				return (coords.length % 2 == 0);
				break;
		}
		
		return false;
	};
	
	element.setValueNoCheck = function(new_val)
	{
		element.setAttribute('value', new_val);
		setNodeTextContents(label, new_val.split(':')[0]);
	};
	
	element.getValue = function()
	{
		return element.getAttribute('value');
	};
	
	var background = parameters ? parameters.background : null;
	
	registerEventHandler(button, 'click', function() {
		var editor = coordsEditor(element, background);
		element.appendChild(editor);
	}, false);
	
	return element;
}

function coordsEditor(form_element, background)
{
	function distance(x1, y1, x2, y2)
	{
		return Math.floor(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
	}
	
	function drawShape(ctx, shape, coords)
	{
		switch(shape)
		{
			case 'rect':
				ctx.fillRect(coords[0], coords[1], coords[2] - coords[0], coords[3] - coords[1]);
				break;
			
			case 'circle':
				ctx.beginPath();
				ctx.arc(coords[0], coords[1], coords[2], 0, 2 * Math.PI, false);
				ctx.fill();
				break;
			
			case 'poly':
				ctx.beginPath();
				for(var i = 0; i < coords.length; i = i + 2)
				{
					ctx.lineTo(coords[i], coords[i + 1]);  
				}
				ctx.fill();
				break;
		}
	}
	
	function drawCanvas(canvas, value, img)
	{
		var ctx = canvas.getContext('2d');
		
		//Clear the canvas
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.restore();
		
		//Draw the background
		if(img)
		{
			ctx.drawImage(img, 0, 0);
		}
		
		if(value)
		{
			//Draw the current shape
			value = value.toString().split(':');
					
			var shape = value[0];
			var coords = value[1].split(',');
			
			ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; //filled semi-transparent red area
			drawShape(ctx, shape, coords);
		}
	}
	
	var container = document.createElement('div');
	addClass(container, 'fixed-panel');
	
	var img;
	
	var canvas = document.createElement('canvas');
	if(background && background.uri)
	{
		img = new Image();
		registerEventHandler(img, 'load', function(){
			canvas.setAttribute('width', img.width);
			canvas.setAttribute('height', img.height);
			setPanelFixedPosition(container, form_element, true);
			
			drawCanvas(canvas, form_element.getValue(), this);
		});
		img.src = background.uri;
	}
	else
	{
		canvas.setAttribute('width', 256);
		canvas.setAttribute('height', 192);
		setPanelFixedPosition(container, form_element, true);
		drawCanvas(canvas, form_element.getValue());
	}
	container.appendChild(canvas);
	
	//Manage the plotting of the new shape
	var newShape = 'poly';
	var newCoords = [];
	var finished = false;
	
	registerEventHandler(canvas, 'click', function(e) {
		
		if(finished)
		{
			//If plotting already complete, ignore.
			return false;
		}
		
		var canvasPos = getNodeScreenPosition(canvas);
		var clickX = e.clientX - canvasPos.left;
		var clickY = e.clientY - canvasPos.top;
		
		var ctx = canvas.getContext('2d');
		
		switch(newShape)
		{
			case 'rect':
				if(newCoords.length <= 2)
				{
					//Add the point
					newCoords.push(clickX);
					newCoords.push(clickY);
				}
				
				if(newCoords.length == 4)
				{
					//Two points : plotting complete
					finished = true;
				}
				break;
			
			case 'circle':
				
				if(newCoords.length == 0)
				{
					//Add the center
					newCoords.push(clickX);
					newCoords.push(clickY);
				}
				else
				{
					//Set the radius
					newCoords.push(distance(clickX, clickY, newCoords[0], newCoords[1]));
					//Plotting complete
					finished = true;
				}
				break;
			
			case 'poly':
				
				if(newCoords.length > 0)
				{
					//Plot line from old point to new one
					ctx.strokeStyle = "blue";
					ctx.beginPath();
					ctx.moveTo(newCoords[newCoords.length - 2], newCoords[newCoords.length - 1]);
					ctx.lineTo(clickX, clickY);
					ctx.stroke();
					
					if(distance(clickX, clickY, newCoords[0], newCoords[1]) < 5)
					{
						//If last point very near the first, plotting complete
						finished = true;
					}
				}
				//Add the point
				newCoords.push(clickX);
				newCoords.push(clickY);
				
				break;
		}
		
		//Actually plot the clicked point to give feedback
		ctx.fillStyle = "blue";
		ctx.fillRect(clickX - 1, clickY - 1, 3, 3);
		
		if(finished)
		{
			drawCanvas(canvas, form_element.getValue(), img);
			ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
			drawShape(ctx, newShape, newCoords);
		}
	}, false);
	
	var controls = document.createElement('div');
	var shape_type = createFormElement('area_shape_type', newShape);
	controls.appendChild(shape_type);
	var cancel = document.createElement('button');
	cancel.setAttribute('data-locale-content', 'cancel');
	translateNode(cancel);
	controls.appendChild(cancel);
	var confirm = document.createElement('button');
	confirm.setAttribute('data-locale-content', 'confirm');
	translateNode(confirm);
	controls.appendChild(confirm);
	container.appendChild(controls);
	
	registerEventHandler(shape_type, 'change', function(e){
		newShape = shape_type.getValue();
		newCoords = [];
		finished = false;
		drawCanvas(canvas, form_element.getValue(), img);
		
		e.stopPropagation();
		e.preventDefault();
	}, false);
	
	registerEventHandler(cancel, 'click', function(e){
		e.stopPropagation();
		container.parentNode.removeChild(container);
	}, false);
	
	registerEventHandler(confirm, 'click', function(e){
		e.stopPropagation();
		if(finished)
		{
			form_element.setValue(newShape + ':' + newCoords.join(','));
			container.parentNode.removeChild(container);
		}
	}, false);
	
	return container;
}

function appendObjectsToList(list, place)
{
	if(place)
	{
		for(var layer in {'background_objects': 0, 'foreground_objects': 0})
		{
			for(var i = 0; i < place[layer].length; i++)
			{
				var entry = new Object({
					type: SELECT_OPTION,
					value: new Object({
						place_id: place.id,
						layer: layer,
						id: place[layer][i].id
					})
				});
				
				if('name' in place[layer][i])
				{
					entry.name = place[layer][i].name;
				}
				else
				{
					entry.lang = place[layer][i].lang;
				}
				
				list.push(entry);
			}
		}
	}
}

function createObjectSelect(parameters)
{
	var place_id = parameters.place_descriptor;
	var place = getPlace(place_id);
	
	var objects = new Array();
	
	//none
	objects.push(new Object({
		type: SELECT_OPTION,
		lang: 'none',
		value: 0
	}));
	
	if(place && !is_scalar(place)) //If place is a real place, list the corresponding objects
	{
		appendObjectsToList(objects, place);
	}
	
	return createSelect(objects);
}

function createPlaceAreaSelect(place, allow_coords)
{
	var areas = new Array();
	
	if(place && !is_scalar(place)) //If place is a real place, list the corresponding objects
	{
		appendObjectsToList(areas, place);
	}
	
	if(allow_coords)
	{		
		areas.push(new Object({
			type: SELECT_INPUT,
			lang: 'area_coords',
			input_type: 'area_coords',
			input_parameters: new Object({
				background: is_scalar(place) ? new Object({uri: place}) //place is a uri
					: getObjectDescriptor(place.background, 'bg_subdir') //place is an object: use its background
			})
		}));
	}
	
	return createSelect(areas);
}

function createAreaSelect(parameters)
{
	if(parameters && parseInt(parameters['background']))
	{
		//If background is a non null integer, it's a place ID
		return createPlaceAreaSelect(getPlace(parameters['background']), true);
	}
	else
	{
		//Else, it's a uri 
		return createPlaceAreaSelect(parameters['background'], true);
	}
}

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS


//END OF MODULE
Modules.complete('editor_form_area');
