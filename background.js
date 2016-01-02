(function() {
    'use strict';
    
    const OPTIONS_KEY = 'options';

    var queryTabsWithSounds = {
        audible: true
    };

    function initialize(callback) {
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

    function muteTabs(tabs, options) {
        tabs.forEach(tab => {
            options.mutedTabs.push(tab);
            toggleMuteTab(tab, options.isMuted);
            chrome.browserAction.setTitle({
                title: 'Unmute'
            });
        });
        options.isMuted = false;
    }

    function unMuteTabs(tabs, options) {
        options.mutedTabs.forEach(tab => {
            toggleMuteTab(tab, options.isMuted);
        });
        options.mutedTabs.length = 0;
        options.isMuted = true;
        chrome.browserAction.setTitle({
            title: 'Mute'
        });
    }

    function muteUnmuteTabs(tabs, options) {
        options.isMuted ? muteTabs(tabs, options) : unMuteTabs(tabs, options);
    }

    function saveToStorage(objectToSave) {
        var preparedObject = {};
        preparedObject[OPTIONS_KEY] = objectToSave;
        chrome.storage.sync.set(preparedObject);
    }

    function getFromStorage(callback) {
        chrome.storage.sync.get(OPTIONS_KEY, function(data) {
            if (chrome.runtime.lastError) {
                console.log('Chrome caused error during sync.get');
                return;
            }
            var defaultOptions = {
                mutedTabs: [],
                isMuted: false
            };
            var options = Object.assign({}, defaultOptions, data.options);
            callback(options);
        });
    }

    function toggleMuteTab(tab, isMuted) {
        chrome.tabs.get(tab.id, foundTab => {
            if (chrome.runtime.lastError) {
                return;
            }
            chrome.tabs.update(foundTab.id, {
                muted: isMuted
            });
        });
    }

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.popupOpen) {
            var options = message.options;
            var imagePrefix = options.isMuted ? 'mute' : 'sound';
            chrome.browserAction.setIcon({
                path: {
                    '19': 'images/' + imagePrefix + '-19.png',
                    '38': 'images/' + imagePrefix + '-38.png'
                }
            });
        }
    });

    function onUpdate(tabId, changeInfo, tab) {
        getFromStorage(function(options) {
            if (options.isMuted) {
                return;
            }
            if (!options.mutedTabs.indexOf(tab) > -1) {
                options.mutedTabs.push(tab);
                saveToStorage(options);
            }
            toggleMuteTab(tab, true);
        });
    }

    chrome.browserAction.onClicked.addListener(initialize);
    chrome.tabs.onUpdated.addListener(onUpdate);
    initialize();
})();