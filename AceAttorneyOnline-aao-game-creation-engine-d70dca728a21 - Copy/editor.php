<?php 
include('common_render.php');
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
	<script type="text/javascript">
		var user_language = '<?php echo language_backend('#CURRENT_LANG#'); ?>';
		
<?php 
$_GET['main'] = 'editor';
define('ALREADY_INCLUDED', true);
include('bridge.js.php');
include('trial.js.php');
?>
	</script>
	<title>
<?php 
if($trial)
{
	echo $trial->getTitle();
}
else
{
	echo 'Ace Attorney Online - Trial Editor (Loading)';
}
?>
	</title>
	<link rel="stylesheet" type="text/css" href="CSS/style_main.css" />
	<link rel="stylesheet" type="text/css" href="CSS/style_form.css" />
	<link rel="stylesheet" type="text/css" href="CSS/editor_global.css" />
	<link rel="stylesheet" type="text/css" href="CSS/editor_allpanels.css" />
	<link rel="stylesheet" type="text/css" href="CSS/editor_storyboard.css" />
	<link rel="stylesheet" type="text/css" href="CSS/editor_court_records.css" />
	<link rel="stylesheet" type="text/css" href="CSS/editor_audio.css" />
	<link rel="stylesheet" type="text/css" href="CSS/editor_places.css" />
	<link rel="stylesheet" type="text/css" href="CSS/editor_popups.css" />
	<link rel="stylesheet" type="text/css" href="CSS/court_records.css" />
</head>
<body>
	
<div id="loading-mask">Loading...</div>

<header class="compact">
	<h1 id="title">
<?php 
if($trial)
{
	echo $trial->getTitle();
}
else
{
	echo 'Loading trial ...';
}
?>
	</h1>
	
	<aside>
		<button id="save" data-locale-content="button_save"></button>
		<button id="playtest" data-locale-content="button_playtest"></button>
	</aside>
	
	<nav>
		<a id="tab_profiles" data-locale-content="tab_profiles"></a>
		<a id="tab_evidence" data-locale-content="tab_evidence"></a>
		<a id="tab_places" data-locale-content="tab_places"></a>
		<a id="tab_popups" data-locale-content="tab_popups"></a>
		<a id="tab_music" data-locale-content="tab_music"></a>
		<a id="tab_sounds" data-locale-content="tab_sounds"></a>
		<a id="tab_frames" data-locale-content="tab_frames"></a>
	</nav>
</header>

<div id="content">
	<section>
	<div id="section_container">
		<h1 id="content_title">Loading...</h1>
		<div id="content_div">
		</div>
	</div>
	</section>
</div>

</body>
</html>
