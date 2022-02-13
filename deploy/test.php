<?php
    require_once("upload-handler.php");

    function completeFileUpload($inputName, $tmpFilename, $filename){
        switch($inputName){
            case "profile-picture":
                $destination = "../profile_pictures";
                break;
            case "lesson-material":
                $destination = "../lesson_materials";
                break;
        }
        rename($tmpFilename, $destination."/$filename");
    }
?>

<!DOCTYPE html>
<html>
    <head>
        <title>File Uploader Test</title>
        <script src='file-uploader.js'></script>
    </head>
    <body>
        <h3>Raw REST File Uploader Test</h3>
        <button onclick="FileUploader.uploader = new FileUploader('profile-picture'); FileUploader.uploader.show();">Upload Profile Picture</button>
        <button onclick="FileUploader.uploader = new FileUploader('lesson-material'); FileUploader.uploader.show();">Upload Lesson Material</button>
    </body>
</html>