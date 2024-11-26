"use strict";
/*
Ace Attorney Online - Player game saving module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'player_save',
	dependencies : ['objects_diff', 'trial', 'base64', 'var_environments', 'player_sound', 'player_debug', 'nodes', 'events'],
	init : function() { }
}));


//INDEPENDENT INSTRUCTIONS


//EXPORTED VARIABLES
var trial_data_diffs = {};
var trial_data_base_dates = {};


//EXPORTED FUNCTIONS
function getSaveData()
{
	trial_data_diffs[trial_information.id] = getDiff(initial_trial_data, trial_data);
	trial_data_base_dates[trial_information.id] = trial_information.last_edit_date;
	
	var save = {
		trial_id: trial_information.id,
		save_date: Math.round(new Date().getTime() / 1000), // Store save date as a UNIX timestamp.
		player_status: player_status,
		top_screen_state: top_screen.state,
		current_music_id: current_music_id,
		trial_data_diffs: trial_data_diffs,
		trial_data_base_dates: trial_data_base_dates
	};
	
	return save;
}

function getSaveString()
{
	return JSON.stringify(getSaveData());
}

function loadSaveData(save)
{
	if(save.trial_id != trial_information.id)
	{
		alert(l('trial_doesnt_match_save'));
		return;
	}
	
	trial_data_diffs = save.trial_data_diffs;
	trial_data_base_dates = save.trial_data_base_dates;
	
	if(save.trial_data_base_dates[trial_information.id] < trial_information.last_edit_date)
	{
		// If trial edited since the game was saved, display a warning.
		alert(l('trial_edited_since_save'));
	}
	
	// Patch trial data using the provided diff.
	trial_data = patch(initial_trial_data, save.trial_data_diffs[save.trial_id]);
	
	refreshCrElements();
	if(save.top_screen_state)
	{
		top_screen.state = save.top_screen_state;
	}
	player_status = save.player_status;
	top_screen.setVariableEnvironment(player_status.game_env);
	playMusic(save.current_music_id);
	refreshHealthBar();
	
	// Refresh all debuggers.
	debugRefreshStatus();
	debugRefreshVars();
	debugRefreshCourtRecords();
	debugRefreshScenes();
	debugRefreshFrames();
	
	if(!player_status.current_frame_index && !player_status.next_frame_index)
	{
		// If no data on current frame is found, save comes from jump link.
		if(player_status.next_frame_id)
		{
			// If target frame provided, read it immediately.
			readFrame(getRowIndexById('frames', player_status.next_frame_id));
		}
		else
		{
			// Else start at the beginning.
			readFrame(1);
		}
		delete player_status.next_frame_id;
	}
	else
	{
		// Loading an actual state save with current state.
		if(player_status.last_frame_merged)
		{
			// If merged frame, proceed immediately to next frame.
			readFrame(player_status.next_frame_index);
		}
		else
		{
			// Else check current frame data to detemine proper UI to display.
			// TODO : improve mechanism with actual UI state save ?
			var frame_data = trial_data.frames[player_status.current_frame_index];
			
			switch(frame_data.action_name)
			{
				case 'MultipleChoices':
				case 'AskForEvidence':
				case 'PointArea':
				case 'InputVars':
				case 'CEStatement':
				case 'DialogueMenu':
				case 'DialogueTalk':
				case 'DialoguePresent':
				case 'ExaminationExamine':
				case 'SceneMove':
					// For player input actions, re-run actions to reload action UI.
					runFrameActionAfter(frame_data, computeParameters(frame_data.action_parameters, player_status.game_env));
					break;
				
				default:
					// Else, display proceed button.
					setClass(bottom_screen, 'proceed');
					break;
			}
		}
	}
	
	// Save loaded : remove start overlay if present.
	removeClass(document.getElementById('screens'), 'start');
}

function loadSaveString(save_string)
{
	loadSaveData(JSON.parse(save_string, function(key, value) {
		if(key == 'game_env')
		{
			// Restore dynamic variable environment from its JSON dump.
			var env = new VariableEnvironment();
			for(var var_name in value)
			{
				env.set(var_name, value[var_name]);
			}
			return env;
		}
		else
		{
			return value;
		}
	}));
}

function refreshSavesList()
{
	var container = document.getElementById('player_saves');
	
	emptyNode(container);
	
	if(window.localStorage)
	{
		var game_saves = JSON.parse(window.localStorage.getItem('game_saves'));
		if(game_saves && (trial_information.id in game_saves))
		{
			for(var save_date in game_saves[trial_information.id])
			{
				(function(save_date, save_string){
					var delete_save_button = document.createElement('button');
					registerEventHandler(delete_save_button, 'click', function() {
						delete game_saves[trial_information.id][save_date];
						if(Object.keys(game_saves[trial_information.id]).length == 0) {
							delete game_saves[trial_information.id];
						}
						window.localStorage.setItem('game_saves', JSON.stringify(game_saves));
						refreshSavesList();
					}, false);
					setNodeTextContents(delete_save_button, '×');
					container.appendChild(delete_save_button);
					
					var save_link = document.createElement('a');

					var url = new URL(window.location.href);
					url.searchParams.set("save_data", Base64.encode(save_string));
					save_link.href = url.toString();

					registerEventHandler(save_link, 'click', function(event){
						if(player_status.proceed_timer && !player_status.proceed_timer_met)
						{
							alert(l('save_error_pending_timer'));
						}
						else if(player_status.proceed_typing && !player_status.proceed_typing_met)
						{
							alert(l('save_error_frame_typing'));
						}
						else
						{
							loadSaveString(save_string);
						}
						event.preventDefault();
					}, false);
					setNodeTextContents(save_link, (new Date(save_date)).toLocaleString());
					container.appendChild(save_link);
				})(parseInt(save_date), game_saves[trial_information.id][save_date]);
			}
		}
		
		var save_button = document.createElement('button');
		addClass(save_button, 'save_new');
		save_button.setAttribute('data-locale-content', 'save_new');
		registerEventHandler(save_button, 'click', function(){
			if(player_status.current_frame_index == 0)
			{
				alert(l('save_error_game_not_started'));
			}
			else if(player_status.proceed_timer && !player_status.proceed_timer_met)
			{
				alert(l('save_error_pending_timer'));
			}
			else if(player_status.proceed_typing && !player_status.proceed_typing_met)
			{
				alert(l('save_error_frame_typing'));
			}
			else
			{
				var game_saves = JSON.parse(window.localStorage.getItem('game_saves'));
				if(!game_saves)
				{
					alert(l('save_explain'));
					game_saves = {};
				}
				if(!game_saves[trial_information.id])
				{
					game_saves[trial_information.id] = {};
				}
				game_saves[trial_information.id][(new Date()).getTime()] = getSaveString();
				window.localStorage.setItem('game_saves', JSON.stringify(game_saves));
				refreshSavesList();
			}
		}, false);
		container.appendChild(save_button);
		
		translateNode(container);
	}
}

//END OF MODULE
Modules.complete('player_save');
