var animeRef = null;
var file = null;      // this is the file to be uploaded, is null when no file is selected
var uploadProgressValue = 0; 
var destination = location.href;  // upload server endpoint
var fileBinData = null;    // ArrayBuffer containing binary data of file to be uploaded
var fileid = null;
var isUploadStarted = false;

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

function initUploaderComponents(){
    // get reference to all necessary UI elements
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
    document.forms['myform']['file'].click();
}

// Function called when file selection is complete
function onFileSelection(){
    var filename = document.forms['myform'].file.value;
    file = event.target.files[0];
    document.getElementById('filename').innerText = `Loading File...`;
    console.log(file);
    fileid = file.lastModified;
    previewFile(file);
    sectionTitle.innerText = "File Preview"
    uploaderSection1.style.display = 'none';
    uploaderSection2.style.display = 'initial';
    uploadBtn.style.display = "initial";
    uploadProgressValue = 0;
}

// Returns the base64 encoded data content of the specficied file
function previewFile(file){
    var reader = new FileReader();
    reader.addEventListener('load', (event)=>{  
        previewImage.src = event.target.result;
        filename.innerText = `Filename: ${file.name}`;
        console.log("Done previewing")
    });
    reader.readAsDataURL(file);
    readFile(file);
}

function readFile(file){
    var filereader = new FileReader();
    filereader.addEventListener('load', (event)=> {
        fileBinData = event.target.result;
        console.log("Done loading file binary data.");
    });
    filereader.readAsArrayBuffer(file);
}

function updateProgressBar(){
    newValue = uploadProgressValue++;
    //console.log("new Value = " + newValue);
    var isDone = newValue >= 100;
    progressValue.innerText = (isDone)? "File Upload Completed" : "Uploading..." + newValue + "%";
    if(isDone){
        // stop animation
        clearTimeout(animeRef);
        animeRef = null;
        newValue = 100;
        console.log("stopping animation");
        progressValue.style.color = "green";
        uploadButtons.style.display = "initial";        
        uploadBtn.style.display = "none";   
        progressCancel.style.display = "none";
    }
    uploadProgress.value = newValue;
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
        uploadFile(file, null, null);
    }
}

// This function is called when the application failed to upload a package to the server
function onNetworkFailure(){
    progressValue.innerText = "Network Error!"
    progressValue.style.color = "red";
    retryBtn.style.display = "initial";
    clearTimeout(animeRef);
    animeRef = null;
}

// Function is calld when user attempts to continue file upload after failure
// The function will atempt to resume file upload by resending last packet that failed
function onContinueFileUpload(){
    // test if network is online before attempting to continue file upload
    progressValue.style.color = "black";
    progressValue.innerText = "Retrying...";
    retryBtn.style.display = "none";
    uploadFile();
}

// This function is called when the file upload has been cancelled by the user
function cancelFileUpload(){    
    uploadButtons.style.display = "initial";
    progressBar.style.display = "none";
    retryBtn.style.display = "none";
    clearTimeout(animeRef);
    animeRef = null;
    uploadProgressValue = 0;
    uploadProgress.value = uploadProgressValue;
    console.log("Upload cancelled");    
}

// uploads file to the server using ajax (handles the network transaction and upload protocol)
// while reporting the progess during upload and on completion
function uploadFile(fileData, onProgressEvent, onFinishedEvent){
    //first send file code to server

    // slice up the file data into an array of data chunks to be uploaded,
    // the chunks will be uploaded one after another
    // the size of each chunk depends on the size of the file
    //animeRef = setInterval(updateProgressBar, 100);
    sendData();
    isUploadStarted = true;
}

function sendData(){
    var ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function(){
        if(ajax.readyState == 4){
            if(ajax.status == 200){
                var response = ajax.responseText;
                console.log(response);
                //alert(response);
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