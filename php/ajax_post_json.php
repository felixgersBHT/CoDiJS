<?php

$posted = &$_POST ;
$fname=$posted["file"];
$pw=$posted["pw"];

if(strcmp($pw, "CoDi") != 0)
	die("You are not authorized to change this file.");

$value = $posted["content"];

$nfile = fopen($fname, "w");

if($nfile != false)
{
	fwrite($nfile, $value);
	fclose($nfile);
}

echo "save done";

?>
