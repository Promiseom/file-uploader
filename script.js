var animeRef = null;
var file = null;                    // this is the file to be uploaded, is null when no file is selected
var numBytesUploaded = 0;           // this is the bytelength that has been successfully uploaded to the server
var destination = location.href;    // upload server endpoint
var fileBytesArray = null;          // ArrayBuffer containing binary data of file to be uploaded
var fileid = null;
var isUploadStarted = false;

// A name to identify this upload just as names are used to identify
// file inputs in a form. The name can be used by the server to identify this upload
// The identification can be used to rename the file from its temporary name accordingly
var inputName = "lectureMaterial";

// UI components
var filename = null;
var sectionTitle = null;
var uploaderSection1 = null;
var uploaderSection2 = null;
var uploadBtn = null;
var previewImage = null;
var progressValue = null;
var progressBar = null;
var uploadButtons = null;
var progressCancel = null;
var uploadProgress = null;
var retryBtn = null;

window.addEventListener("load", (event)=>{initUploaderComponents();});

// get reference to all necessary UI elements
function initUploaderComponents(){
    filename = document.getElementById('filename');
    sectionTitle = document.getElementById("section-title");
    uploaderSection1 = document.getElementById('uploader-section1');
    uploaderSection2 = document.getElementById('uploader-section2');
    uploadBtn = document.getElementById("upload-btn");
    previewImage = document.getElementById('image');
    progressValue = document.getElementById("progress-value");
    progressBar = document.getElementById("progress-bar");
    uploadButtons = document.getElementById("upload-buttons");
    progressCancel = document.getElementById("progress-cancel");
    uploadProgress = document.getElementById("upload-progress");
    retryBtn = document.getElementById("retry-btn");
}

//  Function called to choose file
function openFileSelector(){
    document.forms['myform'].file.click();
}

// Function called when file selection is complete
function onFileSelection(){
    var filename = document.forms['myform'].file.value;
    file = event.target.files[0];
    // if selection was cancelled
    if(!file) { return; }
    document.getElementById('filename').innerText = `Loading File...`;
    console.log(file);
    fileid = file.lastModified;
    previewFile(file);
    sectionTitle.innerText = "File Preview"
    uploaderSection1.style.display = 'none';
    uploaderSection2.style.display = 'initial';
    uploadBtn.style.display = "initial";
    progressBar.style.display = "none";
    numBytesUploaded = 0;
}

// Returns the base64 encoded data content of the specficied file
function previewFile(file){
    var reader = new FileReader();
    reader.addEventListener('load', (event)=>{
        previewImage.src = event.target.result
        filename.innerText = `Filename: ${file.name}`;
        console.log("Done previewing")
    });
    reader.readAsDataURL(file);
    readFile(file);
}

// Reads the file's binary data
function readFile(file){
    var filereader = new FileReader();
    filereader.addEventListener('load', (event)=> {
        fileBytesArray = new Uint8Array(event.target.result);
        console.log("Done loading file binary data.");
    });
    filereader.readAsArrayBuffer(file);
} 

function updateProgressBar(){
    newValue = Math.round(numBytesUploaded / file.size * 100);
    console.log("Upload progress: ", newValue, "%");
    //console.log("new Value = " + newValue);
    var isDone = newValue >= 100;
    progressValue.innerText = (isDone)? "File Upload Completed" : "Uploading..." + newValue + "%";
    uploadProgress.value = newValue;
    if(isDone){
        clearTimeout(animeRef);
        animeRef = null;
        newValue = 100;
        progressValue.style.color = "green";
        uploadButtons.style.display = "initial";        
        uploadBtn.style.display = "none";
        progressCancel.style.display = "none";
    }
}

// This function is called when the upload button has been clicked
// and the application is ready to begin sending file packets to the server
function onUploadFile(){
    if(file != null){
        sectionTitle.innerText = "File Upload"
        uploadButtons.style.display = "none";
        progressValue.style.color = "black";
        progressValue.innerText = "Uploading...";
        progressBar.style.display = "initial";   
        progressCancel.style.display = "initial";   
        pingServer();
    }
}

// This function is called when the application failed to upload a package to the server
function onNetworkFailure(){
    progressValue.innerText = "Network Error!"
    progressValue.style.color = "red";
    retryBtn.style.display = "initial";
    clearTimeout(animeRef);
    animeRef = null;
    isUploadStarted = false;
}

// Function is calld when user attempts to continue file upload after failure
// The function will atempt to resume file upload by resending last packet that failed
function onContinueFileUpload(){
    // test if network is online before attempting to continue file upload
    progressValue.style.color = "black";
    progressValue.innerText = "Retrying...";
    retryBtn.style.display = "none";
    pingServer();
}

// This function is called when the file upload has been cancelled by the user
function cancelFileUpload(){    
    uploadButtons.style.display = "initial";
    progressBar.style.display = "none";
    retryBtn.style.display = "none";
    clearTimeout(animeRef);
    animeRef = null;
    numBytesUploaded = 0;
    uploadProgress.value = numBytesUploaded;
    console.log("Upload cancelled");    
}

// uploads file to the server using ajax (handles the network transaction and upload protocol)
// while reporting the progess during upload and on completion
function uploadFile(){
    console.log("File Upload starting from offset " + numBytesUploaded + " bytes");
    var ajax = new XMLHttpRequest();
    const requestLimit = 1024000;  // the number of bytes that will be sent to the server in a single request
    ajax.onreadystatechange = function(){
        if(ajax.readyState == 4){
            if(ajax.status == 200){
                console.log("Server response: " + ajax.response);
            }else{
                console.log("Upload of data segment failed")
            }
        }
    }
    // split the bytes into requestLimit
    while(numBytesUploaded < file.size){  
        updateProgressBar();      
        var data = fileBytesArray.slice(numBytesUploaded, numBytesUploaded + requestLimit);
        // convert to normal array to avoid increase in the size of data after stringification
        //data = Array.from(data);
        sendData(ajax, data)
        numBytesUploaded += data.length        
    }
    updateProgressBar();
    console.log("Upload complete");
    //ajax.send("fid=" + encodeURIComponent(fileid) + "&fileSize=" + encodeURIComponent(file.size) + "&data=" + encodeURIComponent(data));
}

function sendData(request, bytesData){
    // file data and meta-data
    var fileData = {
        "inputname": inputName, "fid": fileid, "filename": file.name, "fileSize": file.size
    }

    request.open("POST", destination, false);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    console.log("Sending a request");
    //console.log("Sending bytes " + numBytesUploaded + " to server");
    request.send("filedata=" + encodeURIComponent(JSON.stringify(fileData)) + "&binData=" + encodeURIComponent(bytesData));
    //console.log("Data sent waiting for response");
}

function pingServer(){
    var ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function(){
        if(ajax.readyState == 4){
            if(ajax.status == 200){
                var response = ajax.responseText;
                console.log(response);
                console.log(typeof(response));
                response = JSON.parse(response)
                if(response.newFile){
                }else{
                    console.log(`continuing upload from ${response.fileSize} bytes`);
                    numBytesUploaded = response.fileSize;
                }
                uploadFile();
                isUploadStarted = true;
            }else{
                // should retry sending data 2 more times before reporting network error
                onNetworkFailure();
            }
        }
    };
    ajax.open("POST", destination, true);
    ajax.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    ajax.send('fid=' + encodeURIComponent(fileid));
}

function requestUploadCancelation(){
    if(!window.confirm("Are you sure you want to cancel file upload?")){
        return false;
    }
    var ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function(){
        if(ajax.readyState == 4){
            if(ajax.status == 200){
                alert(ajax.responseText);
            }else{
                alert("Failed to inform server of upload cancellation");
            }
            cancelFileUpload();
        }
    }
    ajax.open("POST", destination, true);
    ajax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    ajax.send("cancel-upload=true");
}