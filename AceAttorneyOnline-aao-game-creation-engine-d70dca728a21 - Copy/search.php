<?php
/*
Ace Attorney Online - Trial search engine

*/

include('common_render.php');
includeScript('includes/search_engine.php');
includeScript('layout/common.php');
includeScript('layout/trial.php');

language_load_file('search');

define('TRIALS_PER_PAGE', 20);

try
{
	if(!isset($_GET['search']))
	{
		throw new Exception('No search input');
	}
	
	$criteria = isset($_GET['criteria']) ? $_GET['criteria'] : array();
	$show_private = isset($_GET['show_private']);
	$page_number = isset($_GET['page']) ? intval($_GET['page']) : 1;
	$page_title = l('trial_search_results');
	
	$query = getSearchQueryFor($criteria, $show_private);
}
catch(Exception $e)
{
	$criteria = array(
		'language-is' => UserDataHandler::getCurrentUser()->getLanguage(),
		'featuredTrial-isTrue' => null
	);
	$show_private = false;
	$page_number = 1;
	$page_title = l('trial_search_featured');
	
	$query = getSearchQueryFor($criteria);
}

layout_header(array('style_trial', 'search_global'));

function arrayToParam($array, $param_name)
{
	$output = '';
	
	foreach($array as $key => $value)
	{
		if(is_array($value))
		{
			$output .= arrayToParam($value, $param_name . '[' . rawurlencode($key) . ']');
		}
		else
		{
			$output .= '&' . $param_name . '[' . rawurlencode($key) . ']=' . rawurlencode($value);
		}
	}
	
	return $output;
}

function displayOperatorField($field, $op, $value, $display_field_name=true)
{
	switch($op)
	{
		case 'isTrue':
		case 'isFalse':
			$field_label = l('trial_search_' . $field . '_' . $op);
?>
		<label>
			<span class="full_width" title="<?php e($field_label);?>"><?php e($field_label);?></span>
			<input type="hidden" name="criteria[<?php e($field . '-' . $op); ?>]" />
		</label>
<?php
			break;
		
		default:
			$field_label = ($display_field_name ? l('trial_search_' . $field) . ' ' : '') . l('trial_search_' . $op);
?>
		<label>
			<span title="<?php e($field_label);?>"><?php e($field_label);?></span>
			<input type="text" name="criteria[<?php e($field . '-' . $op); ?>]" value="<?php e($value); ?>" />
		</label>
<?php
			break;
	}
}

function displayAddOperatorItem($field, $op, $criteria)
{
?>	<li>
	<form method="get" action="">
		<input type="hidden" name="search" />
		<input type="submit" value="+" /><?php
	foreach($criteria as $key => $value)
	{
?>		<input type="hidden" name="criteria[<?php e($key);?>]" value="<?php e($value); ?>" />
<?php
	}
	displayOperatorField($field, $op, '', false);
?>
	</form>
	</li>
<?php
}

function generateSearchPanel($criteria, $show_private)
{
?>
<form method="get" action="">
	<input type="hidden" name="search" />
	<h3><?php el('trial_search_current');?></h3>
	<ul>
<?php
	foreach($criteria as $key => $value)
	{
		$field = explode('-', $key, 2);
		$op = $field[1];
		$field = $field[0];
		
		// Generate criteria list with current key removed
		$filtered_criteria = array_diff_key($criteria, array($key => ''));
		
		$link_url = append_sid('?search' . arrayToParam($filtered_criteria, 'criteria') . ($show_private ? '&show_private' : ''));
?>
		<li>
			<a class="button" href="<?php e($link_url);?>">×</a><?php
			displayOperatorField($field, $op, $value);
?>
		</li>
<?php
	}
	
	if($show_private)
	{
		$link_url = append_sid('?search' . arrayToParam($criteria, 'criteria'));
?>
		<li>
			<a class="button" href="<?php e($link_url);?>">×</a><?php
			el('trial_search_private');
?>
		</li>
<?php
	}
?>
	</ul>
	<input type="submit" value="→" />
</form>

<div class="addCriteria">
	<h3><?php el('trial_search_add');?></h3>
<?php

	$available_fields = array('title', 'language', 'authorName', 'featuredTrial', 'collabsName');
	$available_ops = array('isTrue', 'isFalse', 'contains', 'doesNotContain','is', 'isNot', 'hasValueContaining', 'doesNotHaveValueContaining', 'has', 'doesNotHave');
	
	// Remove current search criteria from list of available fields
	foreach($criteria as $key => $value)
	{
		$field = explode('-', $key, 2);
		$field = $field[0];
		$available_fields = array_diff($available_fields, array($field));
	}
	
	$fake_query = TrialSearchQuery::searchFor();
	
	foreach($available_fields as $field)
	{
		$condition = $fake_query->$field();

?>
	<h4><?php el('trial_search_' . $field);?></h4>
	<ul>
<?php
		foreach($available_ops as $op)
		{
			try
			{
				$condition->$op('test');
				displayAddOperatorItem($field, $op, $criteria);
			}
			catch(Exception $e)
			{
			}
		}
?>	</ul>
<?php
	}

	// If not showing private but it would be possible on this query, then show link
	if(!$show_private AND !isQueryPublicOnly($criteria, true))
	{
		$link_url = append_sid('?search' . arrayToParam($criteria, 'criteria') . '&show_private');
?>
	<p>
			<a class="button" href="<?php e($link_url);?>">+</a><?php
			el('trial_search_private');
?>
	</p>
<?php
	}
?>
</div>
<?php
}
?>

<section>
	<h1><?php e($page_title);?></h1>

<aside class="searchPanel">
	<h2><?php el('trial_search'); ?></h2>
<?php
generateSearchPanel($criteria, $show_private);
?>
</aside>

<ol class="trial-list results">
<?php

foreach($query->get(($page_number - 1) * TRIALS_PER_PAGE, TRIALS_PER_PAGE) as $trial)
{
?>
	<li class="trial left"><?php 
	layout_trialCard($trial);
	layout_trialMoreInfo($trial);
	?></li>
<?php
}

?>
</ol>

<div class="pagination">
<?php
el('trial_search_page'); e(' - ');

$nb_pages = ceil($query->getNbResults() / TRIALS_PER_PAGE);

for($i = 1; $i <= $nb_pages; $i++)
{
?>
<a 
	href="<?php e(append_sid('?search' . arrayToParam($criteria, 'criteria') . ($show_private ? '&show_private' : '') . '&page=' . $i));?>"
	<?php if($i == $page_number) { ?> class="current" <?php } ?>
><?php e($i);?></a>
<?php
}
?>
</div>

</section>

<?php

layout_footer();

?>
