<?php

/**
 * Escape and echo string in HTML
 */
function e($string)
{
	echo htmlentities($string, ENT_COMPAT, 'UTF-8');
}

/**
 * Escape and echo string in URL in HTML tag
 */
function eu($string)
{
	e(rawurlencode($string));
}

/**
 * Echo language string
 */
function el($key)
{
	e(l($key));
}

/**
 * Echo language string with replacements
 */
function elr($key, $localevars)
{
	e(lr($key, $localevars));
}

function getCurrentPageRedirectUrl()
{
	$url = $_SERVER['SCRIPT_NAME'];
	if(!empty($_SERVER['QUERY_STRING']))
	{
		$url .= '?' . $_SERVER['QUERY_STRING'];
	}
	
	return $url;
}

/**
 * Echo a URL to a database operation with proper redirection
 */
function echoDbOpUrl()
{
	global $user;
	?>db_op.php?user_session_id=<?php eu($user->data['session_id']);?>&amp;redirect=<?php eu(getCurrentPageRedirectUrl());
}

/**
 * Layout for pages of the AAO site.
 */

function layout_header($stylesheets=array(), $main_script='simple_page')
{
	global $user, $phpbb_root_path, $phpEx;
	
	// Actually display page HTML header if page is displayed
	
	$user->add_lang('common');
	
?><!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php e(getCfg('site_name'));?></title>
	<link rel="stylesheet" type="text/css" href="CSS/style_main.css" />
	<link rel="stylesheet" type="text/css" href="CSS/style_form.css" />
<?php
	foreach($stylesheets as $sheet)
	{
?>	<link rel="stylesheet" type="text/css" href="CSS/<?php eu($sheet);?>.css" />
<?php
	}
?>
	<script type="text/javascript">
		var user_language = '<?php echo language_backend('#CURRENT_LANG#'); ?>';
	</script>
	<script type="text/javascript" src="bridge.js.php?main=<?php eu($main_script);?>" async="async"></script>
</head>
<body>
	<header class="tall s<?php e(rand(1, 4)); ?>">
		<h1 id="title"><img src="img/logo.png" alt="Ace Attorney Online" /></h1>
		
		<aside id="account" class="controls">
<?php
if($user->data['user_id'] != ANONYMOUS)
{
?>
			<a class="button" href="<?php echo append_sid("{$phpbb_root_path}ucp.$phpEx", 'mode=logout', true, $user->session_id); ?>">
				<?php e(sprintf($user->lang['LOGOUT_USER'], $user->data['username'])); ?>
			</a>
<?php	
}
else
{
?>
			<a class="button" href="<?php echo append_sid("{$phpbb_root_path}ucp.$phpEx", 'mode=login'); ?>">
				<?php e($user->lang['LOGIN']); ?>
			</a>
			<a class="button" href="<?php echo append_sid("{$phpbb_root_path}ucp.$phpEx", 'mode=register'); ?>">
				<?php e($user->lang['REGISTER']); ?>
			</a>
<?php
}
?>
		</aside>
		
		<nav>
			<a href="index.php"><?php el('home'); ?></a>
			<a href="search.php"><?php el('search'); ?></a>
<?php
if($user->data['user_id'] != ANONYMOUS)
{
?>
			<a href="manager.php"><?php el('manager'); ?></a>
<?php
}
?>
			<a href="<?php e(getCfg('forum_path')); ?>"><?php el('forums'); ?></a>
			<a href=""><?php el('help'); ?></a>
			<a href="about.php"><?php el('about'); ?></a>
		</nav>
	</header>
	
	<div id="content">
<?php
}

function layout_footer()
{
	//global $db; e($db->sql_num_queries()); // Uncomment to show number of sql queries for debug
?>
		<footer>
			<p><?php elr('copyright_aao', array('year' => date('Y'))); ?><br />
			<?php el('copyright_capcom'); ?></p>
			
			<p><strong><?php el('disclaimer_title'); ?>:</strong> <?php el('disclaimer_text'); ?></p>
		</footer>
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
<?php
}


/*
 * Layout for recurring elements
 */

// Link to a user
function echoUserLink($user)
{
?>
<a class="user" href="search.php?search&criteria[authorOrCollabsId-has]=<?php eu($user->getId()); ?>"><?php 
	e($user->getName());
?></a>
<?php
}

