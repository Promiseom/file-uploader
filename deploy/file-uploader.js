/**
 * author: Promise Anendah
 * Date: February 2022
 */

//automatic add the styles for the uploader all its components
window.addEventListener("load", (event)=>{
    // Get HTML head element
    var head = document.getElementsByTagName('HEAD')[0]; 
    
    // Create new link Element
    var link = document.createElement('link');

    // set the attributes for link element
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'uploader-styles.css'; 

    // Append link element to HTML head
    head.appendChild(link);
});


class FileUploader{
    static uploader = null;

    constructor(inputName){
        this.createUI();

        this.file = null;                    // this is the file to be uploaded, is null when no file is selected
        this.numBytesUploaded = 0;           // this is the bytelength that has been successfully uploaded to the server
        // location of upload script, the location contains the upload handler
        this.destination = location.href;    
        this.fileBytesArray = null;          // ArrayBuffer containing binary data of file to be uploaded
        this.fileid = null;
        this.isUploading = false;

        // A name to identify this upload just as names are used to identify
        // file inputs in a form. The name can be used by the server to identify this upload
        // The identification can be used to rename the file from its temporary name accordingly
        this.inputName = inputName;

        // reference to all UI components
        this.filename = null;
        this.sectionTitle = null;
        this.uploaderSection1 = null;
        this.uploaderSection2 = null;
        this.uploadBtn = null;
        this.previewImage = null;
        this.progressValue = null;
        this.progressBar = null;
        this.uploadButtons = null;
        this.progressCancel = null;
        this.uploadProgress = null;
        this.retryBtn = null;
        this.uiContainer = null;        

        this.initUploaderComponents();

    }

    // get reference to all necessary UI elements
    initUploaderComponents(){
        // get reference to UI elements
        this.filename = document.getElementById('filename');
        this.sectionTitle = document.getElementById("section-title");
        this.uploaderSection1 = document.getElementById('uploader-section1');
        this.uploaderSection2 = document.getElementById('uploader-section2');
        this.uploadBtn = document.getElementById("upload-btn");
        this.previewImage = document.getElementById('image');
        this.progressValue = document.getElementById("progress-value");
        this.progressBar = document.getElementById("progress-bar");
        this.uploadButtons = document.getElementById("upload-buttons");
        this.progressCancel = document.getElementById("progress-cancel");
        this.uploadProgress = document.getElementById("upload-progress");
        this.retryBtn = document.getElementById("retry-btn");
    }

    setUploadHandler(location){
        this.destination = location;
    }

    //  Function called to choose file
    openFileSelector(){
        document.forms['myform'].file.click();
    }

    // Function called when file selection is complete
    onFileSelection(){
        var filename = document.forms['myform'].file.value;
        this.file = event.target.files[0];
        // if selection was cancelled
        if(!this.file) { return; }
        let maxSize = 104857600; // 100 megabytes

        // check file size
        if(this.file.size > maxSize) { 
            alert("Invalid file size, file size limit is 100 mb");
            return;
        }
        
        this.filename.style.color = "black";
        this.filename.innerText = `Loading File...`;
        console.log(this.file);
        this.fileid = this.file.lastModified;
        this.previewFile(this.file);
        this.sectionTitle.innerText = "File Preview"
        this.uploaderSection1.style.display = 'none';
        this.uploaderSection2.style.display = 'initial';
        this.uploadBtn.style.display = "initial";
        this.progressBar.style.display = "none";
        this.numBytesUploaded = 0;
    }

    // Returns the base64 encoded data content of the specficied file
    previewFile(file){
        var reader = new FileReader();
        reader.addEventListener('load', (event)=>{
            this.previewImage.src = event.target.result
            this.filename.innerText = `Filename: ${this.file.name}`;
            console.log("Done previewing")
        });
        reader.readAsDataURL(this.file);
        this.readFile(this.file);
    }

    // Reads the file's binary data
    readFile(file){
        var filereader = new FileReader();
        filereader.addEventListener('load', (event)=> {
            this.fileBytesArray = new Uint8Array(event.target.result);
            console.log("Done loading file binary data.");
        });
        filereader.readAsArrayBuffer(this.file);
    } 

    updateProgressBar(){
        var newValue = Math.round(this.numBytesUploaded / this.file.size * 100);
        console.log("Upload progress: ", newValue, "%");
        //console.log("new Value = " + newValue);
        var isDone = newValue >= 100;
        this.progressValue.innerText = (isDone)? "File Upload Completed" : "Uploading..." + newValue + "%";
        this.uploadProgress.value = newValue;
        if(isDone){
            this.newValue = 100;
            this.progressValue.style.color = "green";
            this.uploadButtons.style.display = "initial";        
            this.uploadBtn.style.display = "none";
            this.progressCancel.style.display = "none";
        }
    }

    // This function is called when the upload button has been clicked
    // and the application is ready to begin sending file packets to the server
    onUploadFile(){
        if(this.file != null){
            this.sectionTitle.innerText = "File Upload"
            this.uploadButtons.style.display = "none";
            this.progressValue.style.color = "black";
            this.progressValue.innerText = "Uploading...";
            this.progressBar.style.display = "initial";   
            this.progressCancel.style.display = "initial";   
            this.pingServer();
        }
    }

    // This function is called when the application failed to upload a package to the server
    onNetworkFailure(){
        this.progressValue.innerText = "Network Error!"
        this.progressValue.style.color = "red";
        this.retryBtn.style.display = "initial";
        this.isUploading = false;
        this.updateProgressBar();
    }

    // Function is calld when user attempts to continue file upload after failure
    // The function will atempt to resume file upload by resending last packet that failed
    onContinueFileUpload(){
        // test if network is online before attempting to continue file upload
        this.progressValue.style.color = "black";
        this.progressValue.innerText = "Retrying...";
        this.retryBtn.style.display = "none";
        this.pingServer();
    }

    // This function is called when the file upload has been cancelled by the user
    cancelFileUpload(){    
        this.uploadButtons.style.display = "initial";
        this.progressBar.style.display = "none";
        this.retryBtn.style.display = "none";
        this.numBytesUploaded = 0;
        this.uploadProgress.value = numBytesUploaded;
        console.log("Upload cancelled");
        this.isUploading = false;
    }

    // uploads file to the server using ajax (handles the network transaction and upload protocol)
    // while reporting the progess during upload and on completion
    uploadFile(){
        console.log("File Upload starting from offset " + this.numBytesUploaded + " bytes");
        var ajax = new XMLHttpRequest();
        const requestLimit = 1024000;  // the number of bytes that will be sent to the server in a single request
        ajax.onreadystatechange = function(){
            if(ajax.readyState == 4){
                if(ajax.status == 200){
                    console.log("Server response: " + ajax.response);
                }else{
                    console.log("Upload of data segment failed")
                    FileUploader.uploader.onNetworkFailure();
                }
            }
        }
        this.updateProgressBar();

        // instance of the uploader to be used in an inner class
        let outInstance = this;
        var id = setInterval(function(){
            if(!outInstance.isUploading || outInstance.numBytesUploaded == outInstance.file.size){ 
                clearInterval(id);
                console.log("Done");
                outInstance.isUploading = false;
                return;
            }        
            var data = outInstance.fileBytesArray.slice(outInstance.numBytesUploaded, outInstance.numBytesUploaded + requestLimit);
            // convert to normal array to avoid increase in the size of data after stringification
            //data = Array.from(data);
            outInstance.sendData(ajax, data);
            outInstance.numBytesUploaded += data.length;
            outInstance.updateProgressBar();
        }, 500);
    }

    sendData(request, bytesData){
        // file data and meta-data
        var fileData = {
            "inputname": this.inputName, "fid": this.fileid, "filename": this.file.name, "fileSize": this.file.size
        }

        request.open("POST", this.destination, false);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        console.log("Sending a request");
        //console.log("Sending bytes " + numBytesUploaded + " to server");
        request.send("filedata=" + encodeURIComponent(JSON.stringify(fileData)) + "&binData=" + encodeURIComponent(bytesData));
        //console.log("Data sent waiting for response");
    }

    pingServer(){
        var ajax = new XMLHttpRequest();
        ajax.onreadystatechange = function(){
            if(ajax.readyState == 4){
                if(ajax.status == 200){
                    var response = ajax.responseText;
                    console.log(response);
                    response = JSON.parse(response);
                    if(response.newFile){
                    }else{
                        console.log(`continuing upload from ${response.fileSize} bytes`);
                        FileUploader.uploader.numBytesUploaded = response.fileSize;
                    }
                    FileUploader.uploader.isUploading = true;
                    FileUploader.uploader.uploadFile();                    
                }else{
                    // should retry sending data 2 more times before reporting network error
                    FileUploader.uploader.onNetworkFailure();
                }
            }
        };
        ajax.open("POST", this.destination, true);
        ajax.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        ajax.send('fid=' + encodeURIComponent(this.fileid));
    }

    requestUploadCancelation(){
        if(!window.confirm("Are you sure you want to cancel file upload?")){
            return false;
        }
        var ajax = new XMLHttpRequest();
        ajax.onreadystatechange = function(){
            if(ajax.readyState == 4){
                if(ajax.status == 200){
                    alert(ajax.responseText);
                    FileUploader.uploader.cancelFileUpload();
                }else{
                    alert("Failed to inform server of upload cancellation");
                }            
            }
        }
        ajax.open("POST", this.destination, true);
        ajax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        ajax.send("cancel-upload=true&file=" + encodeURIComponent(this.fileid));
    }
   
    // called to add the html components for the dialog
    createUI(){
        var htmlContent = `<div id='uploader-frame'>
            <div id='uploader-section1'>
                <p class='section-title'>Choose file to Upload</p>
                <form id='myform'><input type='file' name='file' onchange='FileUploader.uploader.onFileSelection()'/></form>
                <button onclick='FileUploader.uploader.openFileSelector()'>Choose File</button> <button onclick='FileUploader.uploader.close()'>Close</button>
                </div>

                <div id='uploader-section2'>
                <p id='section-title' class='section-title'>File Preview</p>
                <div>
                    <img id='image' src='default.png' alt='No Preview Available'/>
                    <p id='filename'>Filename: ...</p>

                    <div id='progress-bar'>
                        <p id='progress-value' for='upload-progress'>Preparing File Upload...</p>
                        <progress id='upload-progress' value='0' max='100'></progress>
                        <div><button id='retry-btn' onclick='FileUploader.uploader.onContinueFileUpload()'>Retry</button> <button id='progress-cancel' class='red-btn' onclick='FileUploader.uploader.requestUploadCancelation()'>Cancel Button</button></div>
                    </div>

                    <div id='upload-buttons'><button id='upload-btn' onclick='FileUploader.uploader.onUploadFile()'>Upload File</button> <button onclick='FileUploader.uploader.openFileSelector()'>Choose Another File</button></div>
                    <button onclick='FileUploader.uploader.close()'>Close</button>
                    </div>         
                    </div>
                </div>`;

        // add the content to the body element
        this.uiContainer = document.createElement("div");
        this.uiContainer.setAttribute("id", "uploader-container");
        this.uiContainer.innerHTML = htmlContent;
        this.uiContainer.style.display = "none";
        document.querySelector("body").appendChild(this.uiContainer);
    }

    // Makes the uploader dialog visible
    show(){
        document.querySelector("#uploader-container").style.display = "flex";
    }

    // Remove the dialog from the UI
    close(){
        this.destroyUI();
    }

    // called to make the uploader dialog invisible
    destroyUI(){
        document.querySelector("body").removeChild(document.querySelector("#uploader-container"));
    }
    
}