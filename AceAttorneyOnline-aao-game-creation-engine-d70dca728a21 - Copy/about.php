<?php
/*
Ace Attorney Online - About

*/
include('common_render.php');
includeScript('layout/common.php');

language_load_file('about');

layout_header();

?>

<section>
	<h1><?php el('about_aao'); ?></h1>
	
	<h2><?php el('aao_core_team'); ?></h2>
	
	<dl>
		<dt>Unas</dt>
		<dd><?php el('aao_role_unas'); ?></dd>
		
		<dt>Meph</dt>
		<dd><?php el('aao_role_meph'); ?></dd>
		
		<dt>Kroki</dt>
		<dd><?php el('aao_role_kroki'); ?></dd>
		
		<dt>Danielinhoni</dt>
		<dd><?php el('aao_role_daniel'); ?></dd>
		
		<dt>ThePaSch</dt>
		<dd><?php el('aao_role_thepasch'); ?></dd>
	</dl>
	
	<h2><?php el('aao_supporting_teams'); ?></h2>
	
	<dl>
		<dt>Ami, Mick, Codric, Enthalpy, gotMLK7</dt>
		<dd><?php el('aao_mods'); ?></dd>
		
		<dt>Enthalpy, Bad Player, Evolina deLuna</dt>
		<dd><?php el('aao_qa_en'); ?></dd>
		
		<dt>Kalhas, Tear</dt>
		<dd><?php el('aao_qa_fr'); ?></dd>
		
		<dt>sfcpfc</dt>
		<dd><?php el('aao_qa_es'); ?></dd>
		
		<dt>Lex!</dt>
		<dd><?php el('aao_qa_de'); ?></dd>
	</dl>
	
	<h2><?php el('aao_special_thanks'); ?></h2>
	
	<dl>
		<dt>Spparrow</dt>
		<dd><?php el('aao_role_spparrow'); ?></dd>
		
		<dt>henke37</dt>
		<dd><?php el('aao_role_devsupport'); ?></dd>
		
		<dt>Zero, Julioxus, angeltsubasa, ThePaSch, Evolina</dt>
		<dd><?php el('aao_role_translation'); ?></dd>
		
		<dt>Godo, Enter The Jaws Theme, Tor4, Enigmar, Blue Jack, Steven Corteus</dt>
		<dd><?php el('aao_role_music'); ?></dd>
	</dl>
	
</section>

<?php

layout_footer();

?>
