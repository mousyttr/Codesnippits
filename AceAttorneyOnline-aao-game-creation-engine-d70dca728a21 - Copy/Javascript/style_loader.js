"use strict";
/*
 * Ace Attorney Online - CSS style loader and fixer
 * (automatically adds browser prefixes)
 */

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'style_loader',
	dependencies : ['base64', 'loading_bar', 'events', 'page_loaded'],
	init : function(){
		var local_sheet_pattern = new RegExp('^.*(' + cfg['css_dir'] + '\\w+?)\\.css$');
		
		// Fix currently linked styles
		var linked_sheets = document.querySelectorAll('link[rel="stylesheet"]');
		Array.prototype.forEach.call(linked_sheets, function(link){
			var file_path = link.href;
			
			// Check if it is a local stylesheet.
			var local_result = local_sheet_pattern.exec(file_path);
			if(local_result != null)
			{
				// Be sure to fetch latest version of the style
				var local_file_path = local_result[1];
				var file_version = getFileVersion(['css', local_file_path]);
				var final_file_path = local_file_path + '.css?v=' + file_version;
				
				// Perform the fix
				getFixedCSSUrl(final_file_path, function(fixedCSSUrl) {
					var new_link = document.createElement('link');
					new_link.rel = 'stylesheet';
					new_link.type = 'text/css';
					new_link.href = fixedCSSUrl;
					new_link.setAttribute("data-href", final_file_path);
					link.parentNode.insertBefore(new_link, link);
					window.setTimeout(link.parentNode.removeChild.bind(link.parentNode, link), 100);
				});
			}
		});
		
		// Setup loading bar for future styles to load
		var loading_mask = document.getElementById('loading-mask');
		if(loading_mask)
		{
			style_loading_bar = new LoadingBar();
			registerEventHandler(style_loading_bar.element, 'loadComplete', function()
			{
				if(loading_mask && loading_mask.parentNode)
				{
					loading_mask.parentNode.removeChild(loading_mask);
					loading_mask = null;
				}
			}, false);
			loading_mask.appendChild(style_loading_bar.element);
		}
	}
}));

//INDEPENDENT INSTRUCTIONS
/**
 * Load a CSS file from URL, fix it, and send a data URI for the fixed file to a callback handler
 */
function getFixedCSSUrl(originalUrl, fixedCSSUrlHandler) 
{
	// Store base URL of the current page
	var pageBase = window.location.href.replace(/[^\/]+$/, '');
	
	// Store base URL of the target file
	var base = originalUrl.replace(/[^\/]+$/, '');
	if(!base.match(/^([a-z]+:)?\/\//))
	{
		// If not absolute URL, append it to page base
		base = pageBase + base;
	}
	
	// Fetch original file
	var xhr = new XMLHttpRequest();
	xhr.open('GET', originalUrl);
	
	xhr.onreadystatechange = function() {
		if(xhr.readyState === 4) 
		{
			var css = xhr.responseText;
			if(css) 
			{
				css = getStyleFixer().getFixedCSS(css);
				
				// Convert relative URLs to absolute
				css = css.replace(/url\(((?:"|')?)(.+?)\1\)/gi, function($0, quote, url) {
					if(!/^([a-z]{3,10}:|\/|#)/i.test(url)) 
					{ // If url not absolute & not a hash
						// May contain sequences like /../ and /./ but those DO work
						return 'url("' + base + url + '")';
					}
					
					return $0;						
				});

				// behavior URLs shoudn’t be converted (Issue #19)
				css = css.replace(RegExp('\\b(behavior:\\s*?url\\(\'?"?)' + base, 'gi'), '$1');
				
				// CSS code generated : convert to data URI and send to callback
				fixedCSSUrlHandler("data:text/css;charset=utf-8;base64," + Base64.encode(css));
			}
		}
	};
	
	xhr.send(null);
}

/**
 * CSS Style Fixer
 * Engine to dynamically add prefixes to CSS properties and convert their syntax when needed.
 * 
 * Written by Unas <unas.zole@gmail.com>
 * Inspired by Prefix-free <http://leaverou.github.com/prefixfree/>
 */

function StyleFixer()
{
	function isPropertySupported(property)
	{
		function toCamelCase(property_name)
		{
			return property_name.replace(/^-/, '').replace(/-([a-z])?/g, function($0, $1) {
				return $1 ? $1.toUpperCase() : ''; 
			});
		}
		
		if(!isPropertySupported.dummy)
		{
			isPropertySupported.dummy = document.createElement('div').style;
		}
		var camelPropertyName = toCamelCase(property);
		return camelPropertyName in isPropertySupported.dummy;
	}
	
	function isPropertyValueSupported(property, value)
	{
		if(!isPropertyValueSupported.style)
		{
			isPropertyValueSupported.style = document.createElement('div').style;
		}
		isPropertyValueSupported.style[property] = '';
		isPropertyValueSupported.style[property] = value;

		return !!isPropertyValueSupported.style[property];
	}
	
	function isSelectorSupported(selector)
	{
		if(!isSelectorSupported.style)
		{
			isSelectorSupported.style = document.createElement('style');
		}
		
		document.head.appendChild(isSelectorSupported.style);
		isSelectorSupported.style.textContent = selector + '{}';
		var result = !!isSelectorSupported.style.sheet.cssRules.length;
		document.head.removeChild(isSelectorSupported.style);
		return result;
	}
	
	function getPropertyConverter(property_name, prefix)
	{
	    // Switch structure allows easy addition of cases where there is a conversion
		switch(property_name)
		{
			default:
				// By default, no conversion : return false
				return false;
		}
	}
	
	function populateFunctionConverters(target_func, prefix)
	{
		// Convert W3C gradient syntax to legacy prefixed syntax used by mozilla and webkit
		function toLegacyLinearGradient(args_string)
		{
			var args = args_string.split(',');
			args[0] = args[0].trim();
			
			var first_arg;
			
			// Convert first argument
			if(args[0].match(/^to\s/))
			{
				// First arg starting with "to"
				
				// New argument doesn't start with "to"
				first_arg = '';
				
				// And contains reversed directions from original
				var reversedDirections = {
					'top': 'bottom',
					'bottom': 'top',
					'left': 'right',
					'right': 'left'
				};
				for(var dir in reversedDirections)
				{
					if(args[0].match(dir))
					{
						first_arg += reversedDirections[dir] + ' ';
					}
				}
			}
			else if(args[0].match(/deg$/))
			{
				// First arg is degree value
				
				// New argument uses different angle convention...
				first_arg = (90 - parseInt(args[0])) + 'deg';
			}
			else
			{
				first_arg = args[0];
			}
			
			// Rebuild args string
			return first_arg + ',' + args.slice(1).join(',');
		}
		
		// Set all conversion functions for all browsers here !
		var functions = {
			'linear-gradient': {
				sample_property : 'background-image',
				sample_args : 'red, green',
				converters : {
					'moz' : toLegacyLinearGradient,
					'webkit' : toLegacyLinearGradient
					// '*' would correspond to a default if one existed.
				}
			}
		};
		
		// Populate target functions list
		for(var func_name in functions)
		{
			if(!isPropertyValueSupported(functions[func_name].sample_property, func_name + '(' + functions[func_name].sample_args + ')'))
			{
				var converters = functions[func_name].converters;
				var given_converter = converters[prefix] || converters['*'];
				if(given_converter)
				{
					target_func[func_name] = given_converter;
				}
				else
				{
					target_func[func_name] = false;
				}
			}
		}
	}
	
	function populateAtRulesConverters(target_rules, prefix)
	{
		var atrules = {
			'keyframes': {
				sample_args : 'name'
			}
		};
		
		for(var rule_name in atrules)
		{
			if(!isSelectorSupported('@' + rule_name + ' ' + atrules[rule_name].sample_args) 
				&& isSelectorSupported('@-' + prefix + '-' + rule_name + ' ' + atrules[rule_name].sample_args))
			{
				target_rules[rule_name] = false;
			}
		}
	}
	
	// Return a function that performs appropriate replacements on a list of targets
	function getTextConversionFunction(prefix, targets, before, middle, after)
	{
		if(Object.keys(targets).length > 0)
		{
			var regexp = RegExp('(' + before + ')(' + Object.keys(targets).join('|') + ')(' + middle + ')(.*?)(' + after + ')', 'gi');
			
			return (function(sourceText)
			{
				return sourceText.replace(regexp, function(match, before, name, middle, contents, after, offset, string) {
					var new_name = '-' + prefix + '-' + name.trim();
					
					if(targets[name])
					{
						// Target is a function : apply it on the contents
						return before + new_name + middle + targets[name](contents) + after;
					}
					else
					{
						// Target is present but false : only add prefix
						return before + new_name + middle + contents + after;
					}
				});
			});
		}
		else
		{
			return (function(sourceText){return sourceText;});
		}
	}
	
	// Prefix of current browser : will be used to prefix function names
	this.prefix = null;
	// Dictionaries of targets to be converted.
	// Value can be false (just prefix target name) or a function (also convert the target's syntax)
	this.target_properties = {};
	this.target_functions = {};
	this.target_atrules = {};
	
	
	(function init(){
		// Initialise all internal variables and methods
		
		// Go through computed style to find out existing prefixed properties
		var property_list = getComputedStyle(document.documentElement, null);
		for(var i = 0; i < property_list.length; i++)
		{
			var property = property_list[i];
			if(property.charAt(0) == '-')
			{
				// Prefixed property
				
				// Extract prefix and property name
				var dash_pos = property.indexOf('-', 1);
				var prefix = property.substring(1, dash_pos);
				var property_name = property.substring(dash_pos + 1);
				
				if(!this.prefix)
				{
					// Set current browser's prefix
					this.prefix = prefix;
				}
				
				if(Array.prototype.indexOf.call(property_list, property_name) == -1)
				{
					// If unprefixed property not supported, populate targets with converter
					this.target_properties[property_name] = getPropertyConverter(property_name, prefix);
				}
				
				// Check for shorthand property
				var shorthand_name = property_name.substring(0, property_name.indexOf('-'));
				if(isPropertySupported('-' + prefix + '-' + shorthand_name) 
					&& !isPropertySupported(shorthand_name) 
					&& !(shorthand_name in this.target_properties))
				{
					// If shorthand is supported when prefixed only and it hasn't been added yet, add it
					this.target_properties[shorthand_name] = getPropertyConverter(shorthand_name, prefix);
				}
			}
		}
		
		// Now that we know the browser prefix, populate other converters as well
		populateFunctionConverters(this.target_functions, this.prefix);
		populateAtRulesConverters(this.target_atrules, this.prefix);
		
		// Set conversion functions for each target list
		this.convertAllFunctions = getTextConversionFunction(this.prefix, this.target_functions, '\\s|:|,', '\\s*\\(', '\\)');
		this.convertAllProperties = getTextConversionFunction(this.prefix, this.target_properties, '^|\\{|\\s|;', '\\s*:', ';');
		this.convertAllAtRules = getTextConversionFunction(this.prefix, this.target_atrules, '@', '\\s*', '\\s*{');
	}).bind(this)();
	
	// Perform all fixes on a cssText and return a correctly prefixed version.
	this.getFixedCSS = function(cssText)
	{
		// Prefix properties
		var prefixedCssText = this.convertAllProperties(cssText);
		// Prefix functions
		var prefixedCssText = this.convertAllFunctions(prefixedCssText);
		// Prefix at-rules
		var prefixedCssText = this.convertAllAtRules(prefixedCssText);
		
		return prefixedCssText;
	};
}

// Avoid keeping huge stylefixer in memory all the time - clean when not used for a while.
function getStyleFixer() {
	if(getStyleFixer.styleFixer == null)
	{
		// If no stylefixer already exists, generate one
		getStyleFixer.styleFixer = new StyleFixer();
	}
	else
	{
		// Otherwise, cancel previous timeout
		window.clearTimeout(getStyleFixer.cleanTimeout);
	}
	
	// Create a timeout for the current time fixer
	getStyleFixer.cleanTimeout = window.setTimeout(function() {
		getStyleFixer.styleFixer = null;
	}, 5000);
	
	return getStyleFixer.styleFixer;
}

//EXPORTED VARIABLES
var style_loading_bar;

//EXPORTED FUNCTIONS
function includeStyle(name, generated, param)
{
	var local_file_path = (generated ? '' : cfg['css_dir']) + name;
	var file_version = getFileVersion(['css', local_file_path]);
	
	var url = local_file_path + '.css' + (generated ? '.php?' + param : '?v=' + file_version);
	
	style_loading_bar.addOne();
	
	getFixedCSSUrl(url, function(fixedCSSUrl) {
		var load_style = document.createElement('link');
		load_style.rel = 'stylesheet';
		load_style.type = 'text/css';
		load_style.href = fixedCSSUrl;
		load_style.setAttribute("data-stylename", name);
		registerEventHandler(load_style, 'load', style_loading_bar.loadedOne, false);
		registerEventHandler(load_style, 'error', style_loading_bar.failedOne, false);
		document.getElementsByTagName("head")[0].appendChild(load_style);
	});
}

//END OF MODULE
Modules.complete('style_loader');
