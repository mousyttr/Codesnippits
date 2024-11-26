<?php

function includeScript($file_path)
{
	require_once dirname(__FILE__) . '/' . $file_path;
}

spl_autoload_register(function($class_name) {
	if(file_exists('includes/' . $class_name . '.class.php'))
	{
		includeScript('includes/' . $class_name . '.class.php');
	}
});

function escapeJSON($input)
{
	return addcslashes($input, '\\"\'');
}

includeScript('config.php');

?>
