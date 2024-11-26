<?php

include('common.php');

if(!defined('PHPBB_NOT_NEEDED'))
{
	//Link to phpBB install
	define('IN_PHPBB', true);
	$phpbb_root_path = getCfg('forum_path');
	$phpEx = substr(strrchr(__FILE__, '.'), 1);
	include($phpbb_root_path . 'common.' . $phpEx);

	// Start session management
	$user->session_begin();

	// Setup the auth/permissions for this user
	$auth->acl($user->data);

	// setup the user-specific settings, style and language
	$user->setup();
	//End of link to phpBB
}

// Language management
function language_is_installed($language)
{
	return is_dir(getCfg('lang_dir') . $language);
}

function getInstalledLanguage($language)
{
	if(language_is_installed($language))
	{
		return $language;
	}
	else
	{
		return 'en';
	}
}

// Set language, load language files and get locale strings.
function language_backend($key, $load_file = '', $set_language = '')
{
	static $language = null;
	static $loaded_strings = array();
	
	if($set_language != '' AND language_is_installed($set_language))
	{
		// If required, set the language for loading future language files provided the requested language is installed
		$language = $set_language;
	}
	else if(!$language)
	{
		// If not set manually at first use, initialise language automatically
		if($current_user = UserDataHandler::getCurrentUser())
		{
			// Read from phpBB user if phpBB session started.
			$language = getInstalledLanguage($current_user->getLanguage());
		}
		else
		{
			// Otherwise fall back to English.
			$language = getInstalledLanguage('en');
		}
	}
	
	// If required, load a new language file in the current language
	if($load_file != '')
	{
		$file_path = getCfg('lang_dir') . $language . '/' . $load_file . '.js';
		if(file_exists($file_path))
		{
			$new_strings = json_decode(file_get_contents($file_path), true);
		}
		else
		{
			// If file does not exist, fall back to english files (all should exist)
			$new_strings = json_decode(file_get_contents(getCfg('lang_dir') . 'en/' . $load_file . '.js'), true);
		}
		$loaded_strings = array_merge($loaded_strings, $new_strings);
	}
	
	// Actually fetch the language string
	if(!$key)
	{
		// No key given : null result
		return null;
	}
	else if($key == '#CURRENT_LANG#')
	{
		// User wants the current language. Sample use: language-specific getCfg
		return $language;
	}
	else if(isset($loaded_strings[$key]))
	{
		// Key found in AAO translation files : return
		return $loaded_strings[$key];
	}
	else
	{
		// Localisation not found : return the key itself
		return $key;
	}
}

// Set language
function language_set($set_language)
{
	language_backend(null, '', $set_language);
}

// Load language file
function language_load_file($file_name)
{
	language_backend(null, $file_name);
}

// Get locale string
function l($key)
{
	return language_backend($key);
}

// Get locale string and perform replacement of locale variables
function lr($key, $localevars)
{
	$string = l($key);
	
	foreach($localevars as $var_name => $var_value)
	{
		$string = str_replace('<' . $var_name . '>', $var_value, $string);
	}
	
	return $string;
}

// Get list of languages available for trials
function getListTrialLanguages()
{
	static $languages = null;
	
	if($languages == null)
	{
		$languages = array_diff(array_keys(getCfg('admins')), array('all'));
	}
	
	return $languages;
}

language_load_file('common');

?>
