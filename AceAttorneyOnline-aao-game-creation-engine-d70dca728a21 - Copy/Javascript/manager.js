"use strict";
/*
Ace Attorney Online - Manager main module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'manager',
	dependencies : ['simple_page', 'form_db_search', 'events', 'language'],
	init : function() {
		
		// Load language file.
		Languages.setMainLanguage(user_language);
		Languages.requestFiles(['manager'], function(){
			translateNode(document.body);
		});
		
		// Enable warning on big deletion buttons
		var big_delete_buttons = Array.prototype.slice.call(document.querySelectorAll('.big.delete.button'));
		var big_delete_button;
		while(big_delete_button = big_delete_buttons.shift())
		{
			registerEventHandler(big_delete_button, 'click', function(e){
				var confirmDeletion = confirm(l('confirm_delete'));
				
				if(!confirmDeletion)
				{
					e.stopPropagation();
					e.preventDefault();
					return false;
				}
			}, false);
		}
		
		// Enable dynamic user input fields
		var user_inputs = Array.prototype.slice.call(document.getElementsByClassName('user-input'));
		
		var original_input;
		while(original_input = user_inputs.shift())
		{
			var new_input = createDbSearchField('users_by_name', original_input.name);
			original_input.parentNode.replaceChild(new_input, original_input);
		}
		
		// Enable dynamic trial input fields
		var trial_inputs = Array.prototype.slice.call(document.getElementsByClassName('trial-input'));
		
		var original_input;
		while(original_input = trial_inputs.shift())
		{
			// Parse data-criteria attributes
			var criterias = new Object();
			
			var criteria_string = original_input.getAttribute('data-criteria');
			if(criteria_string)
			{
				criterias = JSON.parse(criteria_string);
			}
			else
			{
				criterias = new Object();
			}
			
			var new_input = createDbSearchField('trials_by_title', original_input.name, criterias);
			original_input.parentNode.replaceChild(new_input, original_input);
		}
	}
}));


//INDEPENDENT INSTRUCTIONS


//EXPORTED VARIABLES


//EXPORTED FUNCTIONS


//END OF MODULE
Modules.complete('manager');
