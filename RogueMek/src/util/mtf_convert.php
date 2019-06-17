<?php
	// This utility generates the long string that is used for each MTF in the javascript file RogueMekMechs.js
	// using <BR> replacing all newlines so it all fits on one line (use inspect source on browser to get the good bits)
	$mtfNames = new ArrayObject(array());
	
	$mtf_files = scandir('../../mechs');
	foreach($mtf_files as $filename){
		if(substr($filename, -4) == ".MTF"){
			$file = '../../mechs/'.$filename;
			
			$mtf_name = substr($filename, 0, -4);
			$mtf_content = fread(fopen($file, 'r'), filesize($file));
			
			$mtf_convert = str_replace("\r\n", "<BR>", $mtf_content);
			
			// this commented out section is just for niceness of seeing individual MTF files
			//echo $mtf_name.': "'.$mtf_convert.'"'."\n\n<br>\n\n";
			
			echo '"'.$mtf_convert.'"'."\n,\n";
		}
	}
?>