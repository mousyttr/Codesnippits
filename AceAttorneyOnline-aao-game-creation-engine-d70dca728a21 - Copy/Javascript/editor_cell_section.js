"use strict";
/*
Ace Attorney Online - Library to handle sections that are sequences of cell

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_cell_section',
	dependencies : ['nodes'],
	init : function()
	{
	}
}));

//INDEPENDENT INSTRUCTIONS
var cell_container;
var cell_section_content;

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS
/*
API Definition : 
	section : the element that has the scrolling bar
	container : the element that contains all cells
	
	content_descriptor is an object with the following properties :
		list : array of the elements to display
		offset : index of the first element in the array
		generator : function to generate cells
*/
function setCellSectionDisplay(section, container)
{
	cell_container = container;
	addClass(section, 'cell-section');
	
	closeTab = function()
	{
		removeClass(section, 'cell-section');
	};
}

function initCellSectionContent(content_descriptor)
{
	cell_section_content = content_descriptor;
	emptyNode(cell_container);
	
	reInitCellSectionContent();
}

function reInitCellSectionContent()
{
	emptyNode(cell_container);
	
	for(var i = cell_section_content.offset || 0; i < cell_section_content.list.length; i++)
	{
		cell_container.appendChild(cell_section_content.generator(i));
	}
	
	if(cell_section_content.insert_generator)
	{
		cell_container.appendChild(cell_section_content.insert_generator());
	}
}

//END OF MODULE
Modules.complete('editor_cell_section');
