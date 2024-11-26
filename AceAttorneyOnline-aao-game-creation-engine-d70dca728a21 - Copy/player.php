<?php 
include('common_render.php');
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
	<script type="text/javascript">
		var user_language = '<?php echo language_backend('#CURRENT_LANG#') ?>';

<?php 
$_GET['main'] = 'player';
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
	echo 'Ace Attorney Online - Trial Player (Loading)';
}
?>
	</title>
	<link rel="stylesheet" type="text/css" href="CSS/style_main.css" />
	<link rel="stylesheet" type="text/css" href="CSS/style_form.css" />
	<link rel="stylesheet" type="text/css" href="CSS/player_global.css" />
	<link rel="stylesheet" type="text/css" href="CSS/player_pwstyle.css" />
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
	
	<!--<aside>
		<a href="manager.php" data-locale-content="link_manager"></a>
		<button data-locale-content="button_feature" />
	</aside>-->

	<h2 id="author"></h2>
</header>

<div id="content">
	<section>
		<div id="screens" class="start">
			<div id="screen-meta">
				<div id="lifebar">
					<div id="lifebar-green" style="width:120px;"></div>
					<div id="lifebar-flash" style="width:0px;"></div>
					<div id="lifebar-red" style="width:0px;"></div>
				</div>
			</div>
			
			<div id="screen-loading"></div>
			
			<div id="screen-top"></div>
			
			<div id="screen-bottom">
				<div class="buttonbar-top">
					<a class="bs-button topleft" id="press" data-locale-content="press"></a>
					<a class="bs-button topmiddle" id="present-center" data-locale-content="present"></a>
					<a id="locks"><img src="img/magatama.gif" alt="Psyche locks" /></a>
					<a class="bs-button topright"  id="present-topright" data-locale-content="present"></a>
				</div>
				
				<a class="bs-button center" id="start">
					<span data-locale-content="start"></span>
				</a>
				<span class="bs-button center" id="end" data-locale-content="end"></span>
				<a class="bs-button center" id="proceed">
					<img src="img/player/proceed.gif" alt="Proceed" width="219" height="107" />
				</a>
				<a class="bs-button center" id="skip">
					<img src="img/player/skip.gif" alt="Skip" width="219" height="107" />
				</a>
				<span class="bs-button center" id="wait"></span>
				<a class="bs-button left" id="statement-backwards">
					<img src="img/player/statement_backwards.gif" alt="Back" width="102" height="76" />
				</a>
				<a class="bs-button right" id="statement-forwards">
					<img src="img/player/statement_forwards.gif" alt="Forwards" width="102" height="76" />
				</a>
				<span class="bs-button left" id="statement-wait-backwards"></span>
				<a class="bs-button right" id="statement-skip-forwards">
					<img src="img/player/statement_skip_forwards.gif" alt="Skip" width="102" height="76" />
				</a>
				
				<div id="options">
				</div>
				
				<form id="inputs" action="#">
				</form>
				
				<div id="options-investigation">
					<a id="options-investigation-examine" data-locale-content="examine"></a>
					<a id="options-investigation-move" data-locale-content="move"></a>
					<a id="options-investigation-talk" data-locale-content="talk"></a>
					<a id="options-investigation-present" data-locale-content="present"></a>
				</div>
				
				<div id="evidence-display" class="evidence_display">
				</div>
				
				<div class="buttonbar-bottom">
					<a class="bs-button bottomleft" id="back" data-locale-content="back"></a>
				</div>
			</div>
			
			<div id="screen-examination" class="thin-bars">
				<div class="buttonbar-top">
					<!--<a class="button topmiddle" id="examination-confirm" data-locale-content="confirm"></a> Not used yet : single click on picture -->
				</div>
				<div id="examination"></div>
				<div class="buttonbar-bottom">
					<a class="bs-button bottomleft" id="examination-back" data-locale-content="back"></a>
				</div>
			</div>
		</div>
		
		<div id="courtrecord" class="evidence">
		
			<section id="cr_evidence">
				<div class="courtrecord-header">
					<h1 data-locale-content="evidence"></h1>
					<a id="cr_profiles_switch" class="courtrecord-switchview" data-locale-content="profiles"></a>
				</div>
				
				<div id="cr_evidence_list" class="evidence-list"></div>
			</section>
			
			<section id="cr_profiles">
				<div class="courtrecord-header">
					<h1 data-locale-content="profiles"></h1>
					<a id="cr_evidence_switch" class="courtrecord-switchview" data-locale-content="evidence"></a>
				</div>
				
				<div id="cr_profiles_list" class="evidence-list"></div>
			</section>
			
			<aside id="cr_item_check">
				<div id="screen-cr-item-check" class="thin-bars">
					<div class="buttonbar-top"></div>
					
					<div id="cr-item-check-contents"></div>
					
					<div id="cr-item-check-pagination"></div>
					
					<div class="buttonbar-bottom">
						<a id="cr-item-check-back" class="bs-button bottomleft" data-locale-content="back"></a>
					</div>
				</div>
			</aside>
		</div>
		
		<div id="player-parametres">
			<section>
				<h2 data-locale-content="player_settings"></h2>
			
				<div id="player_settings">
					
				</div>
			</section>
			
			<section>
				<h2 data-locale-content="player_saves"></h2>
			
				<div id="player_saves">
					
				</div>
			</section>
			
			<section id="player_debug" hidden="hidden">
				<h2 data-locale-content="player_debug"></h2>
				
				<details>
					<summary class="h3" data-locale-content="debug_status"></summary>
					<div id="debug_status"></div>
				</details>
				
				<details>
					<summary class="h3" data-locale-content="debug_vars"></summary>
					<div id="debug_vars"></div>
					<button id="debug_add_var" data-locale-content="add_var"></button>
				</details>
				
				<details>
					<summary class="h3" data-locale-content="debug_cr"></summary>
					
					<section>
						<h4 data-locale-content="profiles"></h4>
						<div id="debug_cr_profiles">
						</div>
					</section>
					
					<section>
						<h4 data-locale-content="evidence"></h4>
						<div id="debug_cr_evidence">
						</div>
					</section>
				</details>
				
				<details>
					<summary class="h3" data-locale-content="debug_scenes"></summary>
					<div id="debug_scenes">
					</div>
				</details>
				
				<details>
					<summary class="h3" data-locale-content="debug_frames"></summary>
					<div id="debug_frames">
					</div>
					<button id="debug_show_frame" data-locale-content="show_frame"></button>
				</details>
			</section>

		</div>
	</section>
</div>

<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-2738679-1', 'auto');
  ga('send', 'pageview');

</script>

</body>
</html>
