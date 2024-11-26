"use strict";
/*
Ace Attorney Online - Handling CEs in the storyboard

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_frames_panels',
	dependencies : ['nodes', 'language'],
	init : function() {}
}));

//INDEPENDENT INSTRUCTIONS

// Generate elements from content description
function generateTextElt(tag, description)
{
	var elt = document.createElement(tag);
	
	switch(description.type)
	{
		case 'generated':
			description.generator(elt);
			break;
		
		case 'lang':
			elt.setAttribute('data-locale-content', description.lang);
			for(var key in description.vars)
			{
				elt.setAttribute('data-localevar-' + key, description.vars[key]);
			}
			translateNode(elt);
			break;
		case 'text':
			setNodeTextContents(elt, description.content);
			break;
	}
	
	return elt;
}


//EXPORTED VARIABLES


//EXPORTED FUNCTIONS
function generatePanelSectionHeader(content_description)
{	
	// Build basic DOM structure of the header
	var header = document.createElement('div');
	addClass(header, 'panel-section-header');
	
	header.appendChild(generateTextElt('h1', content_description.title));
	
	if(content_description.delete_fct)
	{
		var delete_button = document.createElement('button');
		addClass(delete_button, 'box-delete');
		delete_button.setAttribute('data-locale-content', 'delete');
		registerEventHandler(delete_button, 'click', content_description.delete_fct, false);
		translateNode(delete_button);
		header.appendChild(delete_button);
	}
	
	var tabs = document.createElement('div');
	addClass(tabs, 'panel-tabs');
	header.appendChild(tabs);
	var tab_contents = document.createElement('div');
	addClass(tab_contents, 'panel-tab-contents');
	header.appendChild(tab_contents);
	
	// Index of tabs
	var tab_list = new Object();
	
	// Function to open a tab given its key
	function openTab(target_key)
	{
		// Close all tabs
		for(var key in tab_list)
		{
			removeClass(tab_list[key].tab, 'open');
		}
		emptyNode(tab_contents);
		
		// Open tab with target key
		addClass(tab_list[target_key], 'open');
		tab_list[target_key].open_fct();
	}
	
	// Build list of subsections
	for(var i = 0; i < content_description.subsections; i++)
	{
		var subsection = content_description.subsections[i];
		
		var tab = generateTextElt('a', subsection.title);
		
		tab_list[subsection.key] = new Object({
			tab: tab, 
			open_fct: subsection.generator.bind(undefined, tab_contents)
		});
		
		registerEventHandler(tab, 'click', openTab.bind(undefined, subsection.key), false);
	}
	
	// Open current subsection
	if(content_description.current_open_key)
	{
		openTab(content_description.current_open_key);
	}
	
	// If needed, append content title
	if(content_description.current_open_title)
	{
		header.appendChild(generateTextElt('h2', content_description.current_open_title));
	}
}


//END OF MODULE
Modules.complete('editor_frames_panels');
