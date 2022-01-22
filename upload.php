<?php
    // handles file uploading
    if(!session_id()){
        session_start();
    }
    
    // upload prepatation
    if(strtolower($_SERVER["REQUEST_METHOD"]) == strtolower('POST')){        
        if(isset($_POST["fid"])){
            $filecode = $_POST["fid"];
            $tempFilename = hash("sha512", $filecode.session_id());
            print_r("tmp filename: $tempFilename");
            $file = fopen("tmp/$tempFilename", "ab");
            fclose($file);
        }else if(isset($_POST['cancel-upload'])){
            print_r("upload cancelled");
        }else{
            print_r("invalid data payload");
        }

        // recieve the request and save the file in the temporary file storage location
        if(isset($_POST["upload-data-payload"]) && isset($_POST["upload-metadata"])){
            $fileData = $_POST("upload-data-payload");
            $metadata = $_POST("upload-metadata");
        }
        die();  
    }
?>