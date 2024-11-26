"use strict";
/*
Ace Attorney Online - Loading bars

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'loading_bar',
	dependencies : ['nodes', 'events'],
	init : function() {}
}));

//INDEPENDENT INSTRUCTIONS


//EXPORTED VARIABLES


//EXPORTED FUNCTIONS
function LoadingBar()
{
	var self = this;
	
	self.element = document.createElement('div');
	addClass(self.element, 'loading-bar');
	
	self.loadedProgress = document.createElement('span');
	addClass(self.loadedProgress, 'loading-bar-loaded');
	self.element.appendChild(self.loadedProgress);
	
	self.failedProgress = document.createElement('span');
	addClass(self.failedProgress, 'loading-bar-failed');
	self.element.appendChild(self.failedProgress);
	
	var current_target = 0;
	var current_loaded = 0;
	var current_failed = 0;
	var current_timeout = null;
	self.updateDisplay = function()
	{
		var loadProgressValue = (current_target > 0 ? current_loaded / current_target : 1);
		
		if(loadProgressValue == 1)
		{
			window.clearTimeout(current_timeout);
			current_timeout = window.setTimeout(function(){
				if(loadProgressValue == 1)
				{
					// If everything loaded properly and nothing new to load after half a second, trigger a loadComplete event
					triggerEvent(self.element, 'loadComplete');
				}
			}, 500);
		}
		
		self.loadedProgress.style.width = loadProgressValue * 100 + '%';
		self.failedProgress.style.width = (current_target > 0 ? current_failed / current_target : 0) * 100 + '%';
	};
	
	
	// Add an object to load
	self.addOne = function() 
	{
		current_target++;
		self.updateDisplay();
	};
	

	// Note one object as loaded
	self.loadedOne = function() 
	{
		current_loaded++;
		self.updateDisplay();
	};
	

	// Note one object as failed to load
	self.failedOne = function()
	{
		current_failed++;
		self.updateDisplay();
	};
	
	self.updateDisplay(); // Trigger display update at least once, and load complete event even if nothing to load
}

//END OF MODULE
Modules.complete('loading_bar');
