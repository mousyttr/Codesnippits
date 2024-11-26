<?php
/*
Ace Attorney Online - Trial File Handling

*/

define('NO_OUTPUT', 0);
define('TRIALDATA_AS_ARRAY', 1);
define('TRIALDATA_AS_JSON', 2);

includeScript('includes/trialdata_constants.php');

class TrialFileHandler
{
	private $file_path;
	private $parent_sequence;
	private $can_write;
	private $can_delete;
	
	private $query;
	private $format;
	
	/*Constructor*/
	function __construct($file_path, $trial, $is_backup = false)
	{
		$this->file_path = $file_path;
		$this->parent_sequence = $trial->getParentSequence();
		$this->trial_id = $trial->getId();
		$this->can_write = !$is_backup AND $trial->canUserWriteContents(UserDataHandler::getCurrentUser());
		$this->can_delete = (($is_backup AND $trial->canUserWriteContents(UserDataHandler::getCurrentUser()))
			OR $trial->canUserWriteMetadata(UserDataHandler::getCurrentUser()));
		$this->is_admin = $trial->isUserAdmin(UserDataHandler::getCurrentUser());
	}
	
	public function getFilePath()
	{
		if($this->is_admin)
		{
			return $this->file_path;
		}
		else
		{
			return null;
		}
	}
	
	public function getLastModificationDate()
	{
		return filemtime($this->file_path);
	}
	
	public function getFormat()
	{
		$this->setFormattingDecoder();
		return $this->format;
	}
	
	public function getTrialData()
	{
		$this->setFormattingDecoder();
		return $this->query->getTrialData(TRIALDATA_AS_JSON);
	}
	
	public function writeContents($contents)
	{
		if(!$this->can_write)
		{
			throw new Exception('error_perms_file_edit');
		}
		
		file_put_contents($this->file_path, $contents);
		
		// Reset formatting handler so that it be re-determined for the new file contents.
		$this->format = null;
		$this->query = null;
	}
	
	public function delete($archive = false, $archive_prefix = '')
	{
		if(!$this->can_delete)
		{
			throw new Exception('error_perms_file_delete');
		}
		
		// If worthy of saving, keep in archives
		if($archive AND filesize($this->file_path) > 10240)
		{
			$filename = basename($this->file_path);
			copy($this->file_path, getCfg('trialdata_deleted_dir') . $archive_prefix . $filename);
		}
		
		unlink($this->file_path);
		
		$this->format = null;
		$this->query = null;
	}
	
	/* Open the file and prepare it for decoding. */
	private function setFormattingDecoder()
	{
		if($this->format != null AND $this->query != null)
		{
			return;
		}
		
		$file = fopen($this->file_path, 'r');
		$firstline = fgets($file);
		fclose($file);
		
		if(strpos($firstline, '//Definition//') === 0 )
		{
			$this->format = trim(substr($firstline, strlen('//Definition//')));
		}
		else
		{
			$this->format = 'Def1';
		}
		
		switch($this->format)
		{
			case 'Def1' :
				$this->query = new FormattingDef1($this->file_path, $this->trial_id, $this->parent_sequence);
				break;
			
			case 'Def2' : case 'Def3' : case 'Def4' : case 'Def5' :
				$this->query = new FormattingSerialized($this->file_path, $this->trial_id, $this->parent_sequence);
				break;
			
			case 'Def6' :
				$this->query = new FormattingDef6($this->file_path);
				break;
		}
	}
	
}

?>
