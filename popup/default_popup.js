let checkbox = document.getElementById("check");
let extension_status = document.getElementById("status");

checkbox.onchange = (e) => {
    console.log("onchange");
    chrome.runtime.getBackgroundPage((backgroundPage) => {
        if (checkbox.checked) {
            extension_status.textContent = "ON";
            backgroundPage.startfetch();
        }
        else {
            extension_status.textContent = "OFF";
            backgroundPage.stopfetch();
        }
    })
}

