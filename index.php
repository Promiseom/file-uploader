<?php 
    session_start();
    require_once("upload.php");

    function completeFileUpload($inputName, $tmpFilename, $originalFilename){
        switch($inputName){
            case "profilePicture":
                $newName = "profile_pictures/";
            break;
            case "lectureMaterial":
                $newName = "lesson_materials/";
            break;
        }
        $newName .= $originalFilename;
        //rename file to new name
        return rename($tmpFilename, $newName);
    }
?>

<!DOCTYPE html>
<html lang='en'> 
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Simple File Uploader</title>
        <script src='script.js'> </script>
        <style>
            @import url(styles.css);
        </style>
    </head>
    <body>
        <div id='uploader-container'>
            <div id='uploader-frame'>
                <div id='uploader-section1'>
                    <p class='section-title'>Choose file to Upload</p>
                    <form id='myform'><input type="file" name='file' onchange='onFileSelection()'/></form>
                    <button onclick='openFileSelector()'>Choose File</button>
                </div>

                <div id='uploader-section2'>
                    <p id='section-title' class='section-title'>File Preview</p>
                    <div>
                        <img id='image' src='default.png' alt='No Preview Available'/>
                        <p id='filename'>Filename: ...</p>

                        <div id='progress-bar'>
                            <p id='progress-value' for='upload-progress'>Preparing File Upload...</p>
                            <progress id='upload-progress' value='0' max='100'></progress>
                            <div><button id='retry-btn' onclick='onContinueFileUpload()'>Retry</button> <button id='progress-cancel' class='red-btn' onclick='requestUploadCancelation()'>Cancel Button</button></div>
                        </div>

                        <div id='upload-buttons'><button id='upload-btn' onclick='onUploadFile()'>Upload File</button> <button onclick='openFileSelector()'>Choose Another File</button></div>

                    </div>         
                </div>
            </div>
        </div>
    </body>
</html>