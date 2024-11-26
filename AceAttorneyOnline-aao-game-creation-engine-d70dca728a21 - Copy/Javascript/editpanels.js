"use strict";
/*
Ace Attorney Online - Editor rows generation module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editpanels',
	dependencies : ['trial_data', 'events', 'nodes'],
	init : function() {}
}));

//INDEPENDENT INSTRUCTIONS


//EXPORTED VARIABLES

//EXPORTED FUNCTIONS

//Minieditors
/*
API definition : 
A minieditor constructor is a function without argument. 
It must build an object with the following properties :
- It must be a block html node
- It must define a closeMinieditor method, without argument, that will be ran just before the minieditor is closed
	Typically, it is used to update the row data
	If the method returns true, the minieditor is indeed closed; if it returns false the minieditor stays

closeOnBlur must be :
- Either false : the minieditor will be closed on mouseot on the source object
- Or an html element. In this case, the minieditor will be closed when neither its contents nor this elt are focused
*/
function miniEditorBuild(obj, constructor, closeOnBlur)
{
	if(!obj.minieditor || obj.minieditor.parentNode == null)
	{
		var minieditor = constructor();
		addClass(minieditor, 'minieditor');
		
		obj.appendChild(minieditor);
		obj.minieditor = minieditor;
		obj.minieditor_focused = false;
		obj.minieditor_control_focused = false;
		obj.minieditor_refocus = false;
		
		if(!closeOnBlur)
		{
			registerEventHandler(obj, 'mouseout', function(e)
			{
				if(e.relatedTarget && obj != e.relatedTarget && !nodeContains(obj, e.relatedTarget))
				{
					//If mouse leaves the minieditor, hide it
					miniEditorHide();
				}
			}, false);
		}
		else
		{
			var focus_event_handler = registerEventHandler(closeOnBlur, 'focus', function(e)
			{
				//control element has been focused
				obj.minieditor_control_focused = true;
			}, true);
			
			var blur_event_handler = registerEventHandler(closeOnBlur, 'blur', function(e)
			{
				//control element lost focus
				obj.minieditor_control_focused = false;
				
				//schedule close unless another element took over by then
				window.setTimeout(function(){
					miniEditorHide();
				}, 0);
			}, true);
			
			registerEventHandler(minieditor, 'mousedown', function(e) {
				var focus_target = getFocusParent(e.target, minieditor);
				
				if(!focus_target)
				{
					//If clicking on a non-focusable element of the minieditor, focus the control element
					obj.minieditor_control_focused = true;
					closeOnBlur.focus();
				}
				else if(focus_target.tagName.toLowerCase() == 'input' && focus_target.type == 'color')
				{
					//Chrome fires a document blur event immediately after the click processes.
					//Restore focus after the blur.
					obj.minieditor_refocus = focus_target;
					
				}
			}, false);
		}
		
		registerEventHandler(minieditor, 'focus', function(e)
		{
			//an element has been focused in the minieditor : mark the minieditor as focused
			obj.minieditor_focused = true;
		}, true);
		registerEventHandler(minieditor, 'blur', function(e)
		{
			//an element lost focus in the minieditor : mark the minieditor as blurred
			obj.minieditor_focused = false;
			
			if(obj.minieditor_refocus)
			{
				//Restore focus to the target if the blur is unwanted, and do not hide the minieditor.
				obj.minieditor_refocus.focus();
				obj.minieditor_refocus = false;
				return;
			}
			
			//and schedule close unless another element took over by then
			window.setTimeout(function(){
				miniEditorHide();
			}, 0);
		}, true);
	}
	
	function miniEditorHide()
	{
		if(obj.minieditor && !obj.minieditor_focused && !obj.minieditor_control_focused)
		{
			if(obj.minieditor.closeMinieditor())
			{
				unregisterAllEvents(obj.minieditor);
				if(obj.minieditor.parentNode != null)
				{
					obj.minieditor.parentNode.removeChild(obj.minieditor);
				}
				obj.minieditor = 0;
				unregisterEvent(obj, 'mouseout');
				if(closeOnBlur)
				{
					unregisterEventHandler(closeOnBlur, 'focus', focus_event_handler);
					unregisterEventHandler(closeOnBlur, 'blur', blur_event_handler);
				}
			}
		}
	}
}

//Edition window
/*
API Definition :
The editor argument must be a block html element with the following properties :
- A refresh method without argument, to update the row or cell affected by the change
- A cancel method without argument, that will be called when the user presses Cancel
- A confirm method without argument, that will be called when the user presses Confirm
	Typically, to update the frame data.
*/
function editorBuild(editor, cell)
{
	if(cell)
	{
		//mark cell as opened
		addClass(cell, 'opened_in_editor');
	}
	
	//place masks to block access to the rest of the page
	var header_mask = document.createElement('div');
	header_mask.className = 'header_mask';
	header.appendChild(header_mask);
	
	var mask = document.createElement('div');
	mask.className = 'window_mask';
	section_container.appendChild(mask);
	
	//Function to close the editor
	editor.close = function()
	{
		editor.refresh();
		
		header.removeChild(header_mask);
		section_container.removeChild(mask);
		if(cell)
		{
			removeClass(cell, 'opened_in_editor');
		}
		content.removeChild(outer_editor);
	};
	
	var outer_editor = document.createElement('div');
	outer_editor.appendChild(editor);
	addClass(editor, 'full_editor_content');
	
	//Add cancel and confirm buttons to the editor
	
	var buttons = document.createElement('div');
	addClass(buttons, 'close_buttons');
	//close the panel without any action
	var cancel = document.createElement('button');
	cancel.setAttribute('data-locale-content', 'cancel');
	registerEventHandler(cancel, 'click', editor.cancel, false);
	buttons.appendChild(cancel);
	//close the panel and save the new data
	var confirm = document.createElement('button');
	confirm.setAttribute('data-locale-content', 'confirm');
	registerEventHandler(confirm, 'click', editor.confirm, false);
	buttons.appendChild(confirm);
	//translate the buttons
	translateNode(buttons);
	outer_editor.appendChild(buttons);
	
	addClass(outer_editor, 'full_editor');
	content.appendChild(outer_editor);
}

//Set the position of a fixed panel on screen
function setPanelFixedPosition(panel, referenceElement, noScroll)
{
	panel.style.position = 'fixed';
	
	panel.position_timer = window.setTimeout(function(){ //Delay until the list has taken its real height
		panel.position_timer = null;
	
		var select_position = getNodeScreenPosition(referenceElement);
		select_position.bottom = select_position.top + referenceElement.clientHeight;
		select_position.right = select_position.left + referenceElement.clientWidth;
		
		//Vertical positioning
		if(!noScroll)
		{
			//If scrollbars allowed, rely on max height
			var max_height_topalign = window.innerHeight - select_position.top - 10;
			var max_height_bottomalign = select_position.bottom - 10;
			
			if(max_height_topalign >= panel.clientHeight || max_height_topalign >= max_height_bottomalign)
			{
				//If the select fits or if has more space than bottom align, align on top and set max height
				panel.style.top = select_position.top+'px';
				panel.style.maxHeight = max_height_topalign+'px';
			}
			else
			{
				//Else, align on bottom and set max height
				panel.style.bottom = (window.innerHeight - select_position.bottom)+'px';
				panel.style.maxHeight = max_height_bottomalign+'px';
			}
		}
		else
		{
			//If scrollbars are to be avoided, only criteria is to appear over the form element
			var bottom_position = select_position.top + panel.clientHeight;
			if(bottom_position <= window.innerHeight - 10)
			{
				//If it fits in the screen, align on top
				panel.style.top = select_position.top+'px';
			}
			else
			{
				//Else, shift it
				panel.style.top = (select_position.top - (bottom_position - (window.innerHeight - 10)))+'px';
			}
		}
		
		//Horizontal positioning
		//Width if aligning on left
		var max_width = window.innerWidth - select_position.left - 10;
		if(max_width >= panel.clientWidth)
		{
			//If the select fits, align on left and set max width
			panel.style.left = select_position.left+'px';
			panel.style.maxWidth = max_width+'px';
		}
		else
		{
			//Else, align on bottom
			max_width = select_position.right - 10;
			panel.style.right = (window.innerWidth - select_position.right)+'px';
			panel.style.maxWidth = max_width+'px';
		}
		
		panel.style.minWidth = referenceElement.clientWidth+'px';
	}, 0);
}

function restorePanelPosition(panel)
{
	panel.style.position = 'relative';
	panel.style.top = '';
	panel.style.bottom = '';
	panel.style.left = '';
	panel.style.right = '';
	panel.style.maxHeight = '';
	panel.style.maxWidth = '';
	panel.style.minWidth = '';

	// A position-the-list timer may be queued from setPanelFixedPosition.
	// If the position is relative, we no longer want that.
	if(panel.list_positioner) {
		window.clearTimeout(panel.list_positioner);
	}
}

//END OF MODULE
Modules.complete('editpanels');
