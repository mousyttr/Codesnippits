"use strict";
/*
Ace Attorney Online - Generic functions to manage DOM nodes

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_save',
	dependencies : ['trial', 'language'],
	init : function() {}
}));

//INDEPENDENT INSTRUCTIONS
function generateTrialFileContents()
{
	return '//Definition//Def6\n' + JSON.stringify(trial_data);
}

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS
function saveTrial()
{
	var id = parseInt(_GET['trial_id']);
	
	if(trial_information.format == 'Def6' || confirm(l('saving_requires_conversion')))
	{
		var contents = generateTrialFileContents();
		var url = 'save.php';
		
		//TODO : do something cleaner, like a small module for ajax queries
		
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4)
			{
				switch(xhr.status)
				{
					case 200:
						// Saving successful, reload
						window.location.search = window.location.search.replace(/&?trial_backup_\w+=[^&]+/g, '');
						//window.location.reload();
						break;
					
					case 403:
						// Permission issue
						alert(l('saving_denied'));
						break;
					
					case 400:
						// Malformed request
						
						// Read debug info
						var debug_info = xhr.responseText;
						var matches = debug_info.match(/^Debug:(-?\d+)\/(-?\d+)|(.*)$/);
						var received_length = parseInt(matches[1]);
						
						// Add info about the place data was truncated
						if(received_length >= 0)
						{
							debug_info += '|' + contents.substring(Math.max(0, received_length - 10), received_length + 10);
						}
						
						alert(l('saving_bad_request') + '\n\n' + debug_info);
						break;
					
					default:
						// Any other error
						alert(l('saving_failed'));
						break;
				}
			}
		};
		
		// We want UTF-8 length for consistency with PHP. c.f. https://stackoverflow.com/a/49599723
		var params = 'trial_id=' + id + '&trial_contents=' + encodeURIComponent(contents) + '&trial_contents_length=' + [...contents].length;
		
		xhr.open('POST', url, false);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.setRequestHeader("Content-length", params.length);
		xhr.setRequestHeader("Connection", "close");
		xhr.send(params);
	}
}

//END OF MODULE
Modules.complete('editor_save');
