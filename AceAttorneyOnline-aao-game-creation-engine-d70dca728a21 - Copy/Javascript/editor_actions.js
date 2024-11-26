"use strict";
/*
Ace Attorney Online - Editor actions module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_actions',
	dependencies : ['nodes', 'events', 'form_elements', 'actions_parameters', 'objects', 'expression_engine', 'var_environments'],
	init : function() {}
}));

//INDEPENDENT INSTRUCTIONS


//EXPORTED VARIABLES


//EXPORTED FUNCTIONS
function actionEditor(row, context)
{
	//Create Context environment
	var context_env = new VariableEnvironment(global_env);
	if(context)
	{
		for(var i in context)
		{
			context_env.set(i, computeParameters(context[i]));
		}
	}
	
	// Get frame data to manipulate
	var frame_data = row.getData();
	var dummy_frame_data = new objClone(frame_data);
	
	// Setup editor structure
	var editor = document.createElement('div');
	
	var title = document.createElement('h2');
	title.setAttribute('data-locale-content', 'action_editor');
	editor.appendChild(title);
	
	var action_select = createFormElement('action', dummy_frame_data.action_name, new Object({context_env: context_env}));
	var action_label = createLabel(action_select, 'choose_action');
	editor.appendChild(action_label);
	
	// Setup parameter editor
	
	// If computed parameters are present, leave interactive mode; otherwise, use it by default.
	var interactive = areOnlyRawParameters(frame_data.action_parameters); 
	var advanced_checkbox = createFormElement('checkbox', !interactive);
	registerEventHandler(advanced_checkbox, 'change', function()
	{
		interactive = !advanced_checkbox.getValue();
		if(dummy_frame_data.action_name)
		{
			parametersEditor(parameters, dummy_frame_data, context_env, interactive);
		}
		else
		{
			emptyNode(parameters);
		}
	}, false);
	
	var advanced_label = createLabel(advanced_checkbox, 'advanced_mode');
	editor.appendChild(advanced_label);
	
	var parameters = document.createElement('div');
	addClass(parameters, 'root');
	addClass(parameters, 'action_params');
	if(dummy_frame_data.action_name)
	{
		parametersEditor(parameters, dummy_frame_data, context_env, interactive);
	}
	registerEventHandler(action_select, 'change', function()
	{
		dummy_frame_data.action_name = action_select.getValue();
		if(frame_data.action_name == dummy_frame_data.action_name)
		{
			dummy_frame_data.action_parameters = new objClone(frame_data.action_parameters);
		}
		else
		{
			dummy_frame_data.action_parameters = new Object();
		}
		
		if(dummy_frame_data.action_name)
		{
			parametersEditor(parameters, dummy_frame_data, context_env, interactive);
		}
		else
		{
			emptyNode(parameters);
		}
	}, false);
	editor.appendChild(parameters);
	
	translateNode(editor);
	
	//Cancel and confirm functions
	editor.cancel = function()
	{
		editor.close();
	};
	editor.confirm = function()
	{
		var frame_index = getRowIndexById('frames', frame_data.id);
		// While trial_data.frames[frame_index] and dummy_frame_data will be equal after this, setting them
		// equal directly changes the memory location of the frame and breaks other references to the row.
		trial_data.frames[frame_index].action_name = dummy_frame_data.action_name;
		trial_data.frames[frame_index].action_parameters = dummy_frame_data.action_parameters;
		editor.close();
	};
	editor.refresh = function()
	{
		populateFrameRow(row);
	};
	
	return editor;
}

function parametersEditor(div, frame_data, context_env, interactive)
{
	emptyNode(div);
	
	var action_def = getActionDescription(frame_data.action_name);
	
	//Store all related context information into the action parameters
	if(action_def.context)
	{
		frame_data.action_parameters.context = new Object();
		for(var param_name in action_def.context)
		{
			frame_data.action_parameters.context[param_name] = prefixRawParameters(context_env.get(param_name));
		}
	}
	
	//Create global parameter environment
	var global_param_env = new VariableEnvironment(context_env);
	
	var refresh = function()
	{
		parametersEditor(div, frame_data, context_env, interactive);
	};
	
	//Global parameters
	var global_div = document.createElement('div');
	addClass(global_div, 'block');
	for(var param_name in action_def.global)
	{
		//Create data field for global params if it doesn't exist yet
		if(!frame_data.action_parameters.global)
		{
			frame_data.action_parameters.global = new Object();
		}
		
		var field = getParameterField(param_name, 
			action_def.global[param_name], 
			frame_data.action_parameters.global, 
			global_param_env,
			refresh, 
			interactive);
		if(field)
		{
			global_div.appendChild(field);
		}
	}
	div.appendChild(global_div);
	
	//Multiple parameters
	for(var nature in action_def.multiple)
	{
		var num_entries;
		//Create data field for the entity if it doesn't exist yet
		if(!frame_data.action_parameters.multiple)
		{
			frame_data.action_parameters.multiple = new Object();
		}
		
		if(frame_data.action_parameters.multiple[nature])
		{
			num_entries = frame_data.action_parameters.multiple[nature].length;
		}
		else
		{
			num_entries = 1;
			frame_data.action_parameters.multiple[nature] = new Array();
			frame_data.action_parameters.multiple[nature][0] = new Object();
		}
		
		var multiple_div = document.createElement('div');
		addClass(multiple_div, 'section');
		var title = document.createElement('h3');
		title.setAttribute('data-locale-content', 'actionParam_' + nature);
		multiple_div.appendChild(title);
		
		for(var i = 0; i < num_entries; i++)
		{
			var entry_div = document.createElement('div');
			addClass(entry_div, 'block');
			
			var entity_param_env = new VariableEnvironment(global_param_env);
			
			for(var param_name in action_def.multiple[nature])
			{
				var field = getParameterField(param_name, 
					action_def.multiple[nature][param_name],
					frame_data.action_parameters.multiple[nature][i],
					entity_param_env,
					refresh, 
					interactive);
				if(field)
				{
					entry_div.appendChild(field);
				}
			}
			
			var delete_button = document.createElement('button');
			delete_button.setAttribute('data-locale-content', 'delete');
			addClass(delete_button, 'box-delete');
			registerEventHandler(delete_button, 'click', (function(index)
			{
				frame_data.action_parameters.multiple[nature].splice(index, 1);
				refresh();
			}).bind(undefined, i), false);
			entry_div.appendChild(delete_button);
			
			multiple_div.appendChild(entry_div);
		}
		
		var insert = document.createElement('a');
		addClass(insert, 'insert');
		insert.setAttribute('data-locale-content', 'actionParam_add_' + nature);
		registerEventHandler(insert, 'click', function()
		{
			frame_data.action_parameters.multiple[nature].push(new Object());
			refresh();
		}, false);
		multiple_div.appendChild(insert);
		
		div.appendChild(multiple_div);
	}
	
	translateNode(div);
}

function getParameterField(param_name, param_def, param_env, var_env, refresh, interactive)
{
	// In interactive mode, check precondition before generating the field; otherwise, display it all the time
	if(!interactive || !param_def.precondition || evaluate_expression(param_def.precondition, var_env))
	{
		if(!param_env[param_name])
		{
			param_env[param_name] = 'val=';
		}
		
		var field = document.createElement('div');
		
		var input; // Generate input field
		var isExpression = !areOnlyRawParameters(param_env[param_name]);
		var hasUnresolvableType = typeDependsOnVariables(param_def) && !interactive;
		
		if(!isExpression && !hasUnresolvableType)
		{
			// If raw value, generate normal type input
			input = getParameterValInput(param_def, param_env[param_name], var_env, interactive);
			registerEventHandler(input, 'change', function()
			{
				param_env[param_name] = prefixRawParameters(input.getValue());
				refresh();
			}, false);
			
			// And reload value to make sure it is a possible value 
			param_env[param_name] = prefixRawParameters(input.getValue());
		}
		else
		{
			// If expression, generate expression type input
			input = getParameterXprInput(param_def, param_env[param_name]);
			registerEventHandler(input, 'change', function()
			{
				param_env[param_name] = prefixXprParameters(input.getValue());
				refresh();
			}, false);
		}
		var label = createLabel(input, 'actionParam_' + param_name);
		field.appendChild(label);
		
		if(interactive)
		{
			// If in interactive mode, set environment variable.
			var_env.set(param_name, input.getValue());
		}
		else if(!hasUnresolvableType)
		{
			// If in non-interactive mode, generate expression checkbox
			// Unless there is an unresolvale type : expression input is forced so no checkbox.
			var xpr_checkbox = createFormElement('checkbox', isExpression);
			registerEventHandler(xpr_checkbox, 'change', function(){
				if(xpr_checkbox.getValue())
				{
					// Transform raw value into expression.
					param_env[param_name] = prefixXprParameters(input.getValue(), true);
				}
				else
				{
					// Transform expression into raw value : empty value...
					param_env[param_name] = prefixRawParameters('');
				}
				refresh();
			}, false);
			var xpr_label = createLabel(xpr_checkbox, 'expression');
			field.appendChild(xpr_label);
		}
		
		return field;
	}
	else
	{
		return null;
	}
}

// Get parameter input for a raw value
function getParameterValInput(param_def, current_value, var_env, interactive)
{
	var computed_value = computeParameters(current_value);
	
	var natural = false;
	
	var input;
	
	switch(param_def.type)
	{
		case 'select' :
			
			var values = new Array();
			for(var i in param_def.values)
			{
				// In interactive mode, check precondition before adding entry. Otherwise, display it all the time.
				if(!interactive || !param_def.values[i].precondition || evaluate_expression(param_def.values[i].precondition, var_env))
				{
					values.push(new Object({
						type: SELECT_OPTION,
						lang: param_def.values[i].name,
						value: i
					}));
				}
			}
			input = createFormCustomSelect(values, computed_value);
			break;
			
		default :
			
			//Check for type parameters and resolve them if needed
			var type_param = new Object();
			if(param_def.type_param)
			{
				for(var type_param_name in param_def.type_param)
				{
					var type_param_value;
					switch(param_def.type_param[type_param_name].type)
					{
						case 'var':
							type_param_value = var_env.get(param_def.type_param[type_param_name].var_name);
							break;
						
						case 'const':
							type_param_value = param_def.type_param[type_param_name].const_value;
							break;
					}
					
					type_param[type_param_name] = type_param_value;
				}
			}
			
			//Create the form element
			input = createFormElement(param_def.type, undefined, type_param);
			break;
	}
	
	if(input.canBe(computed_value))
	{
		input.setValue(computed_value);
	}
	
	return input;
}

// Get parameter input for a computable value : one or several expression fields
function getParameterXprInput(param_def, current_value)
{
	var computed_value = computeParameters(current_value, null, true);
	
	if(param_def.type in type_definitions)
	{
		return getTypeFieldExpressionInput(type_definitions[param_def.type], computed_value);
	}
	else
	{
		// If not explicitly defined, basic scalar type : just an expression field
		return createFormElement('expression', computed_value);
	}
}

function getTypeFieldExpressionInput(type_def, current_value)
{
	switch(type_def.nature)
	{
		case 'scalar':
			// Basic scalar type : just an expression field
			// TODO : handle constant fields
			return createFormElement('expression', current_value);
			break;
		
		case 'object':
			// Composite object type
			
			// Build a root element that acts as a fake form element
			var root_element = document.createElement('span');
			root_element.value = current_value;
			
			// Make sure root value is an object; empty if needed.
			if(root_element.value === null || is_scalar(root_element.value))
			{
				root_element.value = {};
			}
			
			// Recursively build inputs for all fields, while listening on their changes.
			for(var field_name in type_def.fields)
			{
				var field_input = getTypeFieldExpressionInput(type_def.fields[field_name], root_element.value[field_name]);
				registerEventHandler(field_input, 'change', (function(field_input, field_name, e) {
					e.stopPropagation();
					
					root_element.value[field_name] = field_input.getValue();
					triggerEvent(root_element, 'change');
				}).bind(undefined, field_input, field_name), false);
				root_element.appendChild(createLabel(field_input, null, field_name));
			}
			
			// Getter for the composite value
			root_element.getValue = function() { return this.value; };
			
			// Setter for the composite value, NOT SUPPORTED !
			root_element.setValue = function(new_value) { debugger; };
			
			return root_element;
			break;
		
		default:
			// Structure not implemented yet !
			debugger;
			break;
	}
}

//END OF MODULE
Modules.complete('editor_actions');
