"use strict";
/*
Ace Attorney Online - Editor main module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor',
	dependencies : ['style_loader', 'trial', 'language', 'nodes', 'editor_frames', 'editor_profiles', 'editor_evidence', 'editor_places', 'editor_popups', 'editor_music', 'editor_sounds', 'page_loaded', 'events', 'default_data', 'editor_save', 'objects_diff'],
	init : function()
	{
		content_div = document.getElementById('content_div');
		emptyNode(content_div);
		content = document.getElementById('content');
		section = document.getElementsByTagName('section')[0];
		section.style.paddingBottom = 0;
		section_container = document.getElementById('section_container');
		header = document.getElementsByTagName('header')[0];
		title = document.getElementById('content_title');
		
		// Select and load language files.
		Languages.setMainLanguage(user_language);
		if(trial_information)
		{
			Languages.setMainLanguage(trial_information.language);
		}
		
		Languages.requestFiles(['common', 'editor', 'places', 'popups', 'profiles', 'profiles', 'evidence', 'sounds', 'music'], function(){
			translateNode(document.body);
			editor_init();
		});
		
		// Set warning before closing the editor.
		registerEventHandler(window, 'beforeunload', function(e) {
			var diff = getDiff(initial_trial_data, trial_data);
			if(diff != null && !window.save_clicked)
			{
				e.returnValue = l('editor_confirm_exit');
				return l('editor_confirm_exit');
			}
		}, false);
	}
}));

//INDEPENDENT INSTRUCTIONS


//EXPORTED VARIABLES
var content;
var content_div;
var section;
var section_container;
var header;
var title;

var currentTab;
var previousScrollTop = -1;
//function to be ran when the current tab is closed
var closeTab = function(){};

//EXPORTED FUNCTIONS

//Initialise editor
function editor_init()
{
	if(!trial_data)
	{
		setNodeTextContents(document.getElementById('title'), l('not_loaded'));
		setNodeTextContents(document.getElementById('content_title'), l('not_loaded'));
	}
	else
	{
		//Load translation of all default data
		for(var i in default_positions)
		{
			default_positions[i].name = l(default_positions[i].name);
		}
		
		//Load trial title
		setNodeTextContents(document.getElementById('title'), trial_information['title']);
		document.title = trial_information.title + ' - Ace Attorney Online'; // TODO : localise the title
		
		//Register events for buttons
		registerEventHandler(document.getElementById('tab_profiles'), 'click', function()
		{
			openTab('profiles');
		}, false);
		registerEventHandler(document.getElementById('tab_evidence'), 'click', function()
		{
			openTab('evidence');
		}, false);
		registerEventHandler(document.getElementById('tab_places'), 'click', function()
		{
			openTab('places');
		}, false);
		registerEventHandler(document.getElementById('tab_popups'), 'click', function()
		{
			openTab('popups');
		}, false);
		registerEventHandler(document.getElementById('tab_music'), 'click', function()
		{
			openTab('music');
		}, false);
		registerEventHandler(document.getElementById('tab_sounds'), 'click', function()
		{
			openTab('sounds');
		}, false);
		registerEventHandler(document.getElementById('tab_frames'), 'click', function()
		{
			openTab('frames');
		}, false);
		
		registerEventHandler(document.getElementById('save'), 'click', function()
		{
			// Mark the save button as clicked, so we're not exiting the editor.
			window.save_clicked = true;
			saveTrial();
		}, false);
		registerEventHandler(document.getElementById('playtest'), 'click', function(){
			// Playtest button forwards a diff of the changes to be playtested, if any.
			var playtest_diff = getDiff(initial_trial_data, trial_data);
			var playtest_diff_param = '';
			if(playtest_diff != null)
			{
				playtest_diff_param = '&trialdata_diff=' + encodeURIComponent(JSON.stringify(playtest_diff));
			}
			window.open('player.php?trial_id=' + _GET['trial_id'] + playtest_diff_param + '&debug', 'playtest_tab');
		}, false);
		
		//open tab initially
		openTab('profiles');
	}
}

//Tab opening
function openTab(name)
{
	closeTab();
	
	if(currentTab)
	{
		var oldTabButton = document.getElementById('tab_' + currentTab);
		removeClass(oldTabButton, 'open');
	}
	
	var newTabButton = document.getElementById('tab_' + name);
	addClass(newTabButton, 'open');
	
	setNodeTextContents(title, l('tab_'+name));
	
	currentTab = name;
	
	switch(currentTab)
	{
		case 'frames' :
			initFramesTab(section, content_div);
			break;
		
		case 'profiles' : 
			initProfilesTab(section, content_div);
			break;
		
		case 'evidence' :
			initEvidenceTab(section, content_div);
			break;
		
		case 'places' :
			initPlacesTab(section, content_div);
			break;
		
		case 'popups' :
			initPopupsTab(section, content_div);
			break;
		
		case 'music':
			initMusicTab(section, content_div);
			break;
		
		case 'sounds':
			initSoundsTab(section, content_div);
			break;
	}
}

//END OF MODULE
Modules.complete('editor');
