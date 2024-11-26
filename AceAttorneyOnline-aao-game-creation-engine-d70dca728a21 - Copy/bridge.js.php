<?php
/*
Ace Attorney Online - Bridge between PHP and JS

*/

if(!defined('ALREADY_INCLUDED'))
{
	include('common.php');

	header('Content-type: text/javascript; charset=UTF-8');
}

// Enable strict mode
echo '"use strict";' . "\n";

//Export config to JS
echo "var cfg = " . getCfg('ALL', 'JS') . "; \n";
$file_versions = array();

//Export the last edit date of all JS and CSS files
$file_types = array('js', 'css');
foreach($file_types as $type)
{
	$file_versions[$type] = array();
	$files = glob(getCfg($type . '_dir') . '*.' . $type);
	foreach($files as $file)
	{
		$pos = strrpos($file, '.' . $type);
		$file_versions[$type][substr($file, 0, $pos)] = filemtime($file);
	}
}

//Export the last edit date of generated JS files
$file_versions['js.php'] = array();
$generated_js_files = glob('./*.js.php');
foreach($generated_js_files as $file)
{
	$pos = strrpos($file, '.js.php');
	$file_noext = substr($file, 0, $pos);
	switch($file_noext)
	{
		case './default_data':
			// For default_data, take the last modif date of the files it includes into account.
			$file_versions['js.php'][$file_noext] = max(
				filemtime($file),
				filemtime('includes/action_descriptions.php'),
				filemtime('includes/trialdata_constants.php'),
				filemtime('includes/default_values.php')
			);
			break;
		
		default:
			// By default, just take the last modif date of the file.
			$file_versions['js.php'][$file_noext] = filemtime($file);
			break;
	}
}

//Export the last edit date of all language files
$ignore_dirs = array('.', '..');

$file_versions['lang'] = array();
$lang_dirs = array_diff(scandir(getCfg('lang_dir')), $ignore_dirs);
foreach($lang_dirs as $lang_dir)
{
	if(is_dir(getCfg('lang_dir') . $lang_dir))
	{
		$file_versions['lang'][$lang_dir] = array();
		$lang_files = array_diff(scandir(getCfg('lang_dir') . $lang_dir), $ignore_dirs);
		foreach($lang_files as $lang_file)
		{
			$file_versions['lang'][$lang_dir][substr($lang_file, 0, strlen($lang_file) - 3)] = filemtime(getCfg('lang_dir') . $lang_dir . '/' . $lang_file);
		}
	}
}


echo "var file_versions = " . json_encode($file_versions) . ";";

echo "\n\n";

//include top level JS files
echo file_get_contents(getCfg('js_dir') . 'common.js');

echo file_get_contents(getCfg('js_dir') . 'Modules.js');

//Chain to the requested main module
if(isset($_GET['main']))
{
?> 	
Modules.request("<?php echo addslashes($_GET['main']); ?>");
<?php
}

?>
