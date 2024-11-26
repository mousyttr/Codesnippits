<?php
/*
Ace Attorney Online - Def6 formatting handler

*/

class FormattingDef6
{
	private $file_contents;
	
	public function __construct($file_path)
	{
		$this->file_contents = file_get_contents($file_path);
		
		$firstline_end_index = strpos($this->file_contents, "\n");
		$this->file_contents = substr($this->file_contents, $firstline_end_index + 1);
	}
	
	public function getTrialData($output_type=TRIALDATA_AS_ARRAY)
	{
		if($output_type == TRIALDATA_AS_JSON)
		{
			return $this->file_contents;
		}
		else
		{
			return json_decode($this->file_contents);
		}
	}
	
}