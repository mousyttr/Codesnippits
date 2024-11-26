<?php
/*
Interface shared by all elements that can be part of a sequence
*/

interface ISequenceElement
{
	public function getParentSequence();
	public function getPreviousElt();
	public function getNextElt();
}

?>
