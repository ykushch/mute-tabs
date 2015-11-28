function initialize(callback) {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryTabsWithSounds = {
        audible: true
    }

    chrome.tabs.query(queryTabsWithSounds, tabs => {
        getFromStorage(function(options) {
            chrome.runtime.sendMessage({
                popupOpen: true,
                options: options
            });
            muteUnmuteTabs(tabs, options);
            saveToStorage(options);
        });
    });
}

function muteUnmuteTabs(tabs, options) {
    if (options.toggleMute) {
        tabs.forEach(tab => {
            options.mutedTabs.push(tab);
            toggleMuteTab(tab, options.toggleMute);
            chrome.browserAction.setTitle({
                title: 'Unmute'
            });
        });
        options.toggleMute = !options.toggleMute;
    } else {
        options.mutedTabs.forEach(tab => {
            toggleMuteTab(tab, options.toggleMute);
        });
        options.mutedTabs.length = 0;
        options.toggleMute = true;
        chrome.browserAction.setTitle({
            title: 'Mute'
        });
    }
}

function saveToStorage(objectToSave) {
    chrome.storage.sync.set({
        'options': objectToSave
    });
}

function getFromStorage(callback) {
    chrome.storage.sync.get('options', function(data) {
        if (chrome.runtime.lastError) {
            console.log('Chrome caused error during sync.get');
            return;
        }
        var defaultOptions = {
            mutedTabs: [],
            toggleMute: false
        };
        var options = Object.assign({}, defaultOptions, data.options);
        callback(options);
    });
}

function toggleMuteTab(tab, toggleMute) {
    chrome.tabs.update(tab.id, {
        muted: toggleMute
    });
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.popupOpen) {
        var options = message.options;
        var imagePrefix = options.toggleMute ? 'mute' : 'sound';
        chrome.browserAction.setIcon({
            path: {
                '19': 'images/' + imagePrefix + '-19.png',
                '38': 'images/' + imagePrefix + '-38.png'
            }
        });
    }
});

chrome.browserAction.onClicked.addListener(initialize);
initialize();