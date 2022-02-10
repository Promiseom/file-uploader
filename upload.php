<?php
    // handles file uploading
    if(!session_id()){
        session_start();
    }
    
    // upload preparation
    if(strtolower($_SERVER["REQUEST_METHOD"]) == strtolower('POST')){
        // prepare to receive file binary payload data
        if(isset($_POST["fid"])){
            $filecode = $_POST["fid"];
            $tempFilename = getTempFilename($filecode);
            $responseData = ["filename"=> "tmp/$tempFilename", "newFile"=> true, "fileSize"=> 0];
            // check if file exists, response will be the filesize
            if(file_exists("tmp/$tempFilename")){
                $responseData["newFile"] = false;
                $responseData["fileSize"] = filesize("tmp/$tempFilename");
            }else{
                $file = fopen("tmp/$tempFilename", "ab");
                fclose($file);
            }
            print_r(json_encode($responseData));
            die();
        }else if(isset($_POST['cancel-upload'])){
            print_r("upload cancelled");
            die();
        }else if(isset($_POST["filedata"]) && isset($_POST["binData"])){
            $fileMetadata = json_decode($_POST["filedata"]);
            // files binary data is an array of binary data
            $fileBinData = $_POST["binData"];
            $bytesArray = mb_split(",", $fileBinData);
            print_r("Number of bytes uploaded ".sizeof($bytesArray)." ");
            $tmpFilename = "tmp/".getTempFilename($fileMetadata->fid);
            if(file_exists($tmpFilename)){
                $file = fopen($tmpFilename, "ab");
                if($file != NULL){
                    // append the binary content to the file
                    $data = "";
                    foreach($bytesArray as $byte){
                        // we need %% since fprintf function uses % for string formatting
                        $data .= pack("c*", $byte);
                    }
                    fprintf($file, "%s", $data);
                    fclose($file);
                    print_r("Done writing to file");
                    // change file location when upload is complete
                    if(filesize($tmpFilename) == $fileMetadata->fileSize){
                        print_r("File upload complete, Renaming file");
                        $result = completeFileUpload($fileMetadata->inputname, $tmpFilename, $fileMetadata->filename);
                        print_r($result);
                    }
                }else{
                    print_r("Server Error: Unable to save uploaded data segment.");
                }
            }else{
                print_r("Invalid file meta data");
            }
            die();
        }      
    }

    function getTempFilename($fileid){
        return hash("sha512", $fileid.session_id()); 
    }
?>