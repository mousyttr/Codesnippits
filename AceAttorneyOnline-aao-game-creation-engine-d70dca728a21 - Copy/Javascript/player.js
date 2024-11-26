"use strict";
/*
Ace Attorney Online - Player main module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'player',
	dependencies : ['style_loader', 'trial', 'player_save', 'display_engine_screen', 'form_elements', 'language', 'nodes', 'page_loaded', 'events', 'player_sound', 'player_images', 'player_actions', 'actions_parameters', 'var_environments', 'player_courtrecord', 'player_debug'],
	init : function()
	{
		Languages.setMainLanguage(user_language);
		if(trial_information)
		{
			Languages.setMainLanguage(trial_information.language);
		}
		
		Languages.requestFiles(['common', 'player'], function(){
			translateNode(document.body);
			player_init();
		});
	}
}));

//INDEPENDENT INSTRUCTIONS

// Reset proceed conditions for current frame
function resetProceedConditions(conditions)
{
	if(!conditions)
	{
		// If no list of conditions given, reset all.
		conditions = ['click', 'timer', 'typing'];
	}
	
	// Reset given conditions.
	for(var i = 0; i < conditions.length; i++)
	{
		player_status['proceed_' + conditions[i]] =
		player_status['proceed_' + conditions[i] + '_met'] =
			false;
	}
}

function addProceedCondition(condition)
{
	player_status['proceed_' + condition] = true;
}

// Proceeds to next frame if all conditions are met
function proceed(condition, backwards)
{
	// Fullfil given condition
	player_status['proceed_' + condition + '_met'] = true;
	
	if(
		(player_status.proceed_click && !player_status.proceed_click_met) ||
		(player_status.proceed_typing && !player_status.proceed_typing_met) ||
		(player_status.proceed_timer && !player_status.proceed_timer_met)
	)
	{
		// If a proceed condition is not met, cancel
		return;
	}
	
	// No condition left : read next frame
	if(backwards)
	{
		// If backwards (for CEs), find last non hidden frame before the current one
		var index = player_status.next_frame_index - 2;
		while(index > 0 && trial_data.frames[index].hidden)
		{
			index--;
		}
		readFrame(index);
	}
	else
	{
		// If regular, simply use next_frame_index
		readFrame(player_status.next_frame_index);
	}
}

//Initialise player
function player_init()
{
	if(!trial_data)
	{
		setNodeTextContents(document.getElementById('title'), l('not_loaded'));
		emptyNode(document.getElementById('content'));
	}
	else
	{
		//Load trial title
		setNodeTextContents(document.getElementById('title'), trial_information['title']);
		setNodeTextContents(document.getElementById('author'), trial_information['author']);
		document.title = trial_information.title + ' - Ace Attorney Online'; // TODO : localise the title
		
		// Setup game variables environment
		player_status.game_env = new VariableEnvironment(global_env);
		
		// Generate top screen
		top_screen = new ScreenDisplay();
		top_screen.setVariableEnvironment(player_status.game_env);
		document.getElementById('screen-top').appendChild(top_screen.render);
		
		// Generate settings panel
		var settings_panel = document.getElementById('player_settings');
		var mute_checkbox = createFormElement('checkbox');
		registerEventHandler(mute_checkbox, 'change', function(){
			Howler.mute(mute_checkbox.getValue());
		}, false);
		settings_panel.appendChild(createLabel(mute_checkbox, 'mute'));
		
		var instant_checkbox = createFormElement('checkbox');
		registerEventHandler(instant_checkbox, 'change', function(){
			top_screen.setInstantMode(instant_checkbox.getValue());
		}, false);
		settings_panel.appendChild(createLabel(instant_checkbox, 'instant_text_typing'));
		
		// Set button events
		bottom_screen = document.getElementById('screen-bottom');
		
		registerEventHandler(document.getElementById('proceed'), 'click', function(){proceed('click');}, false);
		registerEventHandler(document.getElementById('statement-forwards'), 'click', function(){proceed('click');}, false);
		registerEventHandler(document.getElementById('statement-backwards'), 'click', function(){proceed('click', true);}, false);
		registerEventHandler(document.getElementById('skip'), 'click', top_screen.skip, false);
		registerEventHandler(document.getElementById('statement-skip-forwards'), 'click', top_screen.skip, false);
		
		// Buttons with dynamic frame binding
		var readTargetFrame = function()
		{
			// Manage target action if any.
			switch(this.getAttribute('data-target-action'))
			{
				case 'hide_locks':
					// Hide the locks
					top_screen.locks_display.hideLocks(false);
					break;
				
				default:
					break;
			}
			// Reset action.
			this.removeAttribute('data-target-action');
			
			// Actually read target frame.
			var target_index = parseInt(this.getAttribute('data-target-frame'));
			readFrame(target_index);
		};

		registerEventHandler(document.getElementById('press'), 'click', readTargetFrame, false);
		registerEventHandler(document.getElementById('options-investigation-examine'), 'click', readTargetFrame, false);
		registerEventHandler(document.getElementById('options-investigation-move'), 'click', readTargetFrame, false);
		registerEventHandler(document.getElementById('options-investigation-present'), 'click', readTargetFrame, false);
		registerEventHandler(document.getElementById('options-investigation-talk'), 'click', readTargetFrame, false);
		registerEventHandler(document.getElementById('back'), 'click', readTargetFrame, false);
		registerEventHandler(document.getElementById('examination-back'), 'click', readTargetFrame, false);
		registerEventHandler(document.getElementById('locks'), 'click', readTargetFrame, false);
		
		registerEventHandler(document.getElementById('cr_evidence_switch'), 'click', function(){setClass(document.getElementById('courtrecord'), 'evidence');}, false);
		registerEventHandler(document.getElementById('cr_profiles_switch'), 'click', function(){setClass(document.getElementById('courtrecord'), 'profiles');}, false);
		registerEventHandler(document.getElementById('cr-item-check-back'), 'click', function(){removeClass(document.getElementById('content'), 'cr-check');}, false);
		
		// Display the list of game saves.
		refreshSavesList();
		
		// Display start button.
		var button_start = document.getElementById('start');
		registerEventHandler(button_start, 'click', function(){
			if('save_data' in _GET)
			{
				// If save data given in URL, load it to start the trial.
				loadSaveString(Base64.decode(_GET['save_data']));
			}
			else
			{
				// If no save data given in URL, start from frame 1.
				readFrame(1);
			}
		},false);
	}
}

// Read a frame
var wait_timer = null;
function readFrame(frame_index)
{
	// Reset content class
	setClass(document.getElementById('content'), '');
	// Remove start overlay
	removeClass(document.getElementById('screens'), 'start');
	
	var frame_data = trial_data.frames[frame_index];
	
	if(!frame_data)
	{
		// If frame doesn't exist, end
		setClass(bottom_screen, 'end');
		player_status.current_frame_id = 0;
		player_status.current_frame_index = 0;
		debugRefreshStatus();
		return;
	}
	
	// Update current frame info in status.
	player_status.current_frame_id = frame_data.id;
	player_status.current_frame_index = frame_index;
	debugRefreshStatus();
	
	if(frame_data.hidden)
	{
		readFrame(frame_index + 1);
	}
	else
	{
		// Set default next frame. Actions might override it at a later point.
		player_status.next_frame_index = frame_index + 1;
		
		
		// (Otherwise, inherit pending conditions, eg timer if set)
		if(player_status.last_frame_merged)
		{
			// If merged to previous frame, only reset typing condition.
			resetProceedConditions(['typing']);
		}
		else
		{
			// Else, reset all proceed conditions and timer.
			resetProceedConditions();
			
			window.clearTimeout(wait_timer);
			wait_timer = null;
		}
		
		// Handle frame wait time
		if(frame_data.wait_time > 0)
		{
			// Clear previous timer if any.
			if(wait_timer)
			{
				window.clearTimeout(wait_timer);
			}
			
			// Start the new timer.
			wait_timer = window.setTimeout(function(){ proceed('timer'); }, frame_data.wait_time);
		}
		
		// Handle proceed condition
		if(!frame_data.merged_to_next)
		{
			// If not a merged frame, set the proceed conditions.
			// (Otherwise, proceed immediately)
			
			if(wait_timer)
			{
				// If there is a wait timer pending, set time condition.
				addProceedCondition('timer');
			}
			else
			{
				// Else, set click condition.
				addProceedCondition('click');
			}
		}
		
		// Compute parameters (evaluate expressions if needed, etc.)
		var computed_parameters = computeParameters(frame_data.action_parameters, player_status.game_env);
		
		// If not merged to previous frame, prepare for clearing displayed CR icons
		if(!player_status.last_frame_merged)
		{
			top_screen.iconsPrepareClear();
		}
		
		// Run "before" actions (actions that do not require input nor redirect the player) for all frames
		runFrameActionBefore(frame_data, computed_parameters);
		
		// Run only the "after" part of the last action in a set of merged frames
		if(frame_data.action_name)
		{
			// Frame has an action : store it as latest action frame
			player_status.latest_action_frame_index = frame_index;
			player_status.computed_parameters = computed_parameters;
		}
		
		var after_typing_callback;
		if(frame_data.merged_to_next)
		{
			// Merged frame : do not run the action
			after_typing_callback = function() {
				proceed('typing');
			};
		}
		else
		{
			after_typing_callback = function() {
				runFrameActionAfter(trial_data.frames[player_status.latest_action_frame_index], player_status.computed_parameters); // Run latest action
				player_status.latest_action_frame_index = 0; // Action has been run : clean the variable
				player_status.computed_parameters = null;
				proceed('typing');
			};
		}
		
		addProceedCondition('typing');
		top_screen.loadFrame(frame_data, null, after_typing_callback);
		
		// Play sound and music
		if(frame_data.sound != SOUND_NONE)
		{
			playSound(frame_data.sound);
		}

		if(frame_data.music == MUSIC_UNCHANGED) {
			//pass
		} else if(frame_data.music_fade) {
			var to_volume = frame_data.music_fade.to_volume;
			var duration = frame_data.music_fade.duration;
			if(frame_data.music == MUSIC_STOP) {
				fadeMusic(0.0, duration, stopMusic);
			} else {
				crossfadeMusic(frame_data.music, frame_data.music_fade.same_position, to_volume, duration);
			}
		} else if(frame_data.music == MUSIC_STOP) {
			stopMusic();
		} else {
			playMusic(frame_data.music);
		}
		
		// Store merged status
		player_status.last_frame_merged = frame_data.merged_to_next;
	}
}

//EXPORTED VARIABLES
// Player interface components
var top_screen;
var bottom_screen;

// Status information
var player_status = new Object({
	current_frame_id: 0,
	current_frame_index: 0,
	next_frame_index: 1, // Next frame index
	last_frame_merged: false,
	
	// Action status (for merged frames)
	latest_action_frame_index: 0,
	computed_parameters: [],
	
	
	game_env: null,
	health: 120,
	health_flash: 0,
	game_over_target: 0,
	
	// Proceed conditions
	proceed_click: false, // Click on proceed button required
	proceed_click_met: false, // Proceed button has been clicked
	proceed_timer: false, // Waiting for a timer to complete
	proceed_timer_met: false, // Timer is over
	proceed_typing: false, // Waiting for typing to complete
	proceed_typing_met: false // Typing complete
});

//EXPORTED FUNCTIONS


//END OF MODULE
Modules.complete('player');
