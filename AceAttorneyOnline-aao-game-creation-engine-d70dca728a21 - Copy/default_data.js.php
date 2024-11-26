<?php
/*
Ace Attorney Online - Load data about default resources into JS

*/

include('common_render.php');
includeScript('includes/action_descriptions.php');
includeScript('includes/trialdata_constants.php');
includeScript('includes/default_values.php');

header('Content-type: text/javascript; charset=UTF-8');
header('Cache-Control: max-age=7200');

?>
/*
Ace Attorney Online - Default data module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'default_data',
	dependencies : [],
	init : function() { }
}));


//INDEPENDENT INSTRUCTIONS


//EXPORTED VARIABLES

//Definition of available descriptor types
var type_definitions = JSON.parse("<?php

echo escapeJSON(json_encode(getTypeDefinition('ALL')));

?>");

//Definition of available actions
var action_descriptions = JSON.parse("<?php

echo escapeJSON(json_encode(getActionParametersType('ALL')));

?>");

// Trial data constants
<?php
//Export trial data constants to JS
defineConstants('JS');

echo "var default_positions = " . place_positions('ALL', 'JS') . "; \n";
echo "var default_places = " . places('ALL', 'JS') . "; \n";
echo "var default_profiles = " . profiles('ALL', 'JS') . "; \n";

//Functions to read directories
class DirScanner {
	
	private static function encodeURI($url)
	{
		// http://php.net/manual/en/function.rawurlencode.php
		// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/encodeURI
		$unescaped = array(
			'%2D'=>'-','%5F'=>'_','%2E'=>'.','%21'=>'!', '%7E'=>'~',
			'%2A'=>'*', '%27'=>"'", '%28'=>'(', '%29'=>')'
		);
		$reserved = array(
			'%3B'=>';','%2C'=>',','%2F'=>'/','%3F'=>'?','%3A'=>':',
			'%40'=>'@','%26'=>'&','%3D'=>'=','%2B'=>'+','%24'=>'$'
		);
		$score = array(
			'%23'=>'#'
		);
		return strtr(rawurlencode($url), array_merge($reserved,$unescaped,$score));
	}
	
	private static function appendEntry(&$files, $directory, $entry, $is_dir, $file_extension, $recursive)
	{
		if($is_dir)
		{
			// If entry is a directory, ignore if not in recursive mode.
			if($recursive AND $entry != '.' AND $entry != '..')
			{
				// If in recursive mode, scan it, prepend entry to all its elements and add to result.
				$entry_contents = self::scan($directory . $entry . '/', $file_extension, $recursive);
				
				if($entry_contents != null AND count($entry_contents) > 0)
				{					
					foreach($entry_contents as &$subentry)
					{
						$subentry = $entry . '/' . $subentry;
					}
					
					$files[$entry] = $entry_contents;
					$files['//is_assoc'] = true;
				}
			}
		}
		else
		{
			// If entry is a file, just check the extension and strip it as needed.
			if($file_extension === '')
			{
				$files[] = $entry;
			}
			else
			{
				$rpos = strrpos($entry, $file_extension);
				
				if($rpos == strlen($entry) - strlen($file_extension))
				{
					$files[] = substr($entry, 0, $rpos);
				}
			}
		}
	}
	
	private static function sortAndReturn(&$files)
	{
		if(array_key_exists('//is_assoc', $files))
		{
			asort($files);
			ksort($files);
			unset($files['//is_assoc']);
		}
		else
		{
			sort($files);
		}
		
		return $files;
	}
	
	private static function fetch_remote_index($uri)
	{
		// Remote indexes are cached for 1 hour.
		$cache_validity = 3600;
		
		$cache_dir = getCfg('cache_dir');
		if (!file_exists($cache_dir))
		{
			mkdir($cache_dir, 0777, true);
		}
		$cache_file = $cache_dir . 'remote_dir_' . md5($uri);
		$text_data = null;
		
		if(file_exists($cache_file))
		{
			if(time() - filemtime($cache_file) >= $cache_validity)
			{
				// Expired cache : just remove the cache file.
				unlink($cache_file);
			}
			else
			{
				// Valid cache date : read the file.
				$file_content = file_get_contents($cache_file);
				
				// Check that the cache is for the correct uri indeed (handle md5 collision).
				// Cached URI is stored as the first line of the file.
				$npos = strpos($file_content, "\n");
				$cached_uri = substr($file_content, 0, $npos);
				if($cached_uri == $uri)
				{
					// Valid cache : use it !
					$text_data = substr($file_content, $npos + 1);
				}
			}
		}
		
		if($text_data === null)
		{
			// If no matching cache found, fetch the data.
			$text_data = @file_get_contents($uri);
			
			// Store it into the cache directory.
			file_put_contents($cache_file, $uri . "\n" . $text_data);
		}
		
		return $text_data;
	}
	
	public static function scan($directory, $file_extension = '', $recursive = false)
	{
		if(strpos($directory, 'http://') === 0)
		{
			// Scanning remote directory over HTTP.
			$dh = self::fetch_remote_index(self::encodeURI($directory));
			
			if($dh !== null AND strpos($dh, '<title>Index of') !== null)
			{
				// File received is an index page for the directory : proceed to parse.
				$files = array();
				
				preg_match_all('#<a href="([^?/"][^/"]*)(/?)">#', $dh, $matches, PREG_SET_ORDER);
				
				foreach($matches as $match)
				{
					self::appendEntry($files, $directory, urldecode($match[1]), $match[2] == '/', $file_extension, $recursive);
				}
				
				return self::sortAndReturn($files);
			}
			else
			{
				return false;
			}
		}
		else
		{
			// Scanning local directory.
			if(is_dir($directory))
			{
				$files = array();
				
				$dh  = opendir($directory);
				while (false !== ($entry = readdir($dh)))
				{
					self::appendEntry($files, $directory, $entry, is_dir($directory . $entry), $file_extension, $recursive);
				}
				closedir($dh);
				
				return self::sortAndReturn($files);
			}
			else
			{
				return false;
			}
			
		}
	}
}

?>

//number of sprites for all default profiles
var default_profiles_nb = JSON.parse("<?php

$default_profile_icons_dir = getCfg('picture_dir') . getCfg('icon_subdir');
$icon_extension = '.png';
$default_profile_sprites_dir = getCfg('picture_dir') . getCfg('talking_subdir');
$sprite_extension = '.gif';

$default_profiles_nb = array();

$default_profile_icons = DirScanner::scan($default_profile_icons_dir, $icon_extension);
foreach($default_profile_icons as $profile_name)
{
	$default_profiles_nb[$profile_name] = 0;
	
	$profile_sprites = DirScanner::scan($default_profile_sprites_dir . $profile_name . '/', $sprite_extension);
	if($profile_sprites !== false)
	{
		$default_profiles_nb[$profile_name] = count($profile_sprites);
	}
}

ksort($default_profiles_nb);

echo escapeJSON(json_encode($default_profiles_nb));

?>");

//startup animations for default profiles
var default_profiles_startup = JSON.parse("<?php
includeScript('includes/startup_anim_list.php');
?>");

//default pieces of evidence
var default_evidence = JSON.parse("<?php
$default_evidence_dir = getCfg('picture_dir') . getCfg('evidence_subdir');
$default_evidence = DirScanner::scan($default_evidence_dir, '.png');

echo escapeJSON(json_encode($default_evidence));
?>");

//default backgrounds
var default_backgrounds = JSON.parse("<?php

$default_backgrounds_dir = getCfg('picture_dir') . getCfg('bg_subdir');
$default_backgrounds = DirScanner::scan($default_backgrounds_dir, '.jpg', true);

echo escapeJSON(json_encode($default_backgrounds));
?>");

//loop start for default music
var default_loop_start = JSON.parse("<?php
includeScript('includes/music_loop_start.php');
?>");

var default_music = JSON.parse("<?php

$default_music_dir = getCfg('music_dir');
$default_music = DirScanner::scan($default_music_dir, '.mp3', true);

echo escapeJSON(json_encode($default_music));
?>");

var default_sounds = JSON.parse("<?php

$default_sounds_dir = getCfg('sounds_dir');
$default_sounds = DirScanner::scan($default_sounds_dir, '.mp3');

echo escapeJSON(json_encode($default_sounds));
?>");

var default_popups = JSON.parse("<?php

$default_popups_dir = getCfg('picture_dir') . getCfg('popups_subdir');
$default_popups = DirScanner::scan($default_popups_dir, '.gif');

echo escapeJSON(json_encode($default_popups));
?>");

//EXPORTED FUNCTIONS


//END OF MODULE
Modules.complete('default_data');
