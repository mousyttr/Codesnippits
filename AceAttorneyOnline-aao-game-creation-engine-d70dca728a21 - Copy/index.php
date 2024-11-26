<?php
/*
Ace Attorney Online - Homepage

*/

include('common_render.php');
includeScript('layout/common.php');
includeScript('layout/trial.php');
include($phpbb_root_path . 'includes/bbcode.' . $phpEx); 

language_load_file('home');

layout_header(array('home_global', 'style_trial'));

?>

<section>
	<h1><?php el('homepage'); ?></h1>

	<aside>
		<h2><?php el('random_featured'); ?></h2>
<?php
$random_featured = TrialSearchQuery::searchFor()
	->publicTrial()->isTrue()
	->featuredTrial()->isTrue()
	->language()->is(UserDataHandler::getCurrentUser()->getLanguage())
	->getRandom();

if($random_featured != null && $random_featured->exists())
{	
	layout_trialCard($random_featured);
}
?>
	</aside>

	<p><?php el('welcome'); ?></p>
	<p><?php el('site_presentation'); ?></p>
	<p><?php el('no_download'); ?></p>
	
	<aside>
		<h2><?php el('affiliates'); ?></h2>
		
		<a href="http://ace-attorney.info/"><img alt="Ace-Attorney.info" src="img/affiliates/aa-info.png" /></a>
		<a href="http://www.court-records.net"><img alt="Court Records" src="img/affiliates/courtrecords.gif" /></a>
		<a href="http://gyakusheets.houjun.com/"><img alt="Gyakusheets" src="img/affiliates/gyakusheets.png" /></a>
	</aside>
	
	<aside>
		<h2><?php el('contact'); ?></h2>
		<a href="mailto:unas.zole+AAO@gmail.com">Unas</a>
	</aside>
	
	<aside class="ad">
		<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
		<!-- Annonces site AAO - V6 -->
		<ins class="adsbygoogle"
			 style="display:inline-block;width:336px;height:280px"
			 data-ad-client="ca-pub-7413165816696184"
			 data-ad-slot="9591758972"></ins>
		<script>
		(adsbygoogle = window.adsbygoogle || []).push({});
		</script>
	</aside>

<?php

$news_forum_id = getCfg('news_cat');
$news_forum_id = intval($news_forum_id[language_backend('#CURRENT_LANG#')]);

if($news_forum_id > 0)
{

?>
	<h2><?php el('news'); ?></h2>
<?php
	$latest_news = $db->sql_query('SELECT * FROM ' . TOPICS_TABLE . '
		LEFT JOIN ' . POSTS_TABLE . '
		ON topic_first_post_id = post_id
		WHERE ' . TOPICS_TABLE . '.forum_id = ' . $news_forum_id . '
		ORDER BY topic_time DESC
		LIMIT 0,2');

	while($news = $db->sql_fetchrow($latest_news))
	{
		$forum_id = $news['forum_id'];
		$topic_id = $news['topic_id'];
?>
	<article>
		<header>
			<h3><?php e($news['topic_title']); ?></h3>
			<time><?php elr('posted_on', array(
				'date' => date(l('date_format'), $news['topic_time']),
				'time' => date(l('time_format'), $news['topic_time'])
			)); ?></time>
		</header>
		
		<div>
<?php

		$parse_flags = ($row['bbcode_bitfield'] ? OPTION_FLAG_BBCODE : 0) | OPTION_FLAG_SMILIES;
		echo generate_text_for_display($news['post_text'], $news['bbcode_uid'], $news['bbcode_bitfield'], $parse_flags, true);
?>
		</div>
		
		<footer>
			<a href="<?php echo append_sid("{$phpbb_root_path}viewtopic.$phpEx", "f=$forum_id&amp;t=$topic_id"); ?>"><?php el('view_comments'); ?></a>
		</footer>
		
	</article>
<?php
	}
}

?>
</section>

<?php
layout_footer();

?>
