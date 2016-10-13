const notification_id = "stackexchange_unread";
const access_data = {
    "key": "your_key",
    "access_token": "your_token",
    "since": "0",
    "page": "1",
    "pagesize": "100",
    "filter": "withbody"
}
const item_types = ["comment_id", "answer_id", "question_id"];

let fetch_loop = true;
let timerId;

initStorage();

function post_type(item) {
    if (item.comment_id) {
        return "comment_id";
    }
    else if (item.answer_id) {
        return "answer_id";
    }
    else if (item.question_id) {
        return "question_id";
    }
}

chrome.browserAction.onClicked.addListener((tab) => {
    if (fetch_loop) {
        fetch_loop = false;
        stopfetch();
    }
    else {
        fetch_loop = true;
        startfetch();
    }
    toggleIcon();
    toggleTitle();
})

function toggleIcon() {
    if (fetch_loop) {
        chrome.browserAction.setIcon({"path": {
            "19": "icons/stackexchange-19.png",
            "38": "icons/stackexchange-38.png"
        }
        })
    }
    else {
        chrome.browserAction.setIcon({"path": {
            "19": "icons/disableicon-19.png",
            "38": "icons/disableicon-38.png"
        }
        })
    }
}

function toggleTitle() {
    if (fetch_loop) {
        chrome.browserAction.setTitle({"title": "StackNotifier enable"})
    }
    else {
        chrome.browserAction.setTitle({"title": "StackNotifier disable"})
    }
}

function buildURL() {
    let base = "https://api.stackexchange.com/2.2/inbox/unread" + "?";
    for (let key of Object.keys(access_data)) {
        base += key + "=" + access_data[key] + "&";
    }
    base = base.substr(0, base.length - 1);
    let encoded_base = encodeURI(base);
    return encoded_base;
}

function get_unread() {
    const url = buildURL()
    fetch(url).then((response) => {
        console.log(response.ok, response.statusText);
        if (response.ok) {
            if (response.headers.get("Content-Type").includes("application/json")) {
                return response.json();
            }
        }
        else {
            console.error("Error!");
        }
    }).then((json_data) => {
        if (json_data.items.length === 0) {
            return;
        }
        else {
            for (let v of json_data.items) {
                let notified;
                let id_type = post_type(v);
                chrome.storage.local.get(id_type, (res) => {
                    console.log(res);
                    if (res[id_type].includes(v[id_type])) {
                        notified = true;
                    }
                    else {
                        notified = false;
                        addStorage(id_type, v[id_type]);
                    }
                });
                if (notified) continue;
                let message_type = v.item_type.replace(/_/g, " ");
                let title = message_type + " from " + v.site.name;
                chrome.notifications.create(String(v[id_type]), {
                    "type": "basic",
                    "title": title,
                    "message": v.body
                })
            }
        }
    })
    .catch((error) => {
        console.error("Error:", error);
    })
}

startfetch();

function get_info() {
    get_unread();
    timerId = setTimeout(get_info, 10000);
}

function startfetch() {
    console.log("Start fetch");
    timerId = setTimeout(get_info, 0);
}

function stopfetch() {
    console.log("Stop fetch");
    clearTimeout(timerId)
}

function initStorage() {
    let obj = {};
    for (let v of item_types) {
        obj[v] = [];
    }
    chrome.storage.local.set(obj);
}

function addStorage(key, value) {
    if (item_types.includes(key)) {
        chrome.storage.local.get(key, (item) => {
            let elements = Array.concat(item[key]);
            elements.push(value);
            let obj = {}
            obj[key] = elements;
            chrome.storage.local.set(obj)
        })
    }
    else {
        throw new Error("invalid key;" + key + " is not includes in item_types");
    }
}
