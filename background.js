(function() {
    'use strict';
    
    const OPTIONS_KEY = 'options';

    var queryTabsWithSounds = {
        audible: true
    };

    function initialize(callback) {
        getFromStorage(function(options) {
            enforceSettings(options);
            saveToStorage(options);
        });
    }

    function onClick() {
        getFromStorage(function(options) {
            options.isMuted = !options.isMuted;
            enforceSettings(options);
            saveToStorage(options);
        });
    }

    function enforceSettings(options) {
        chrome.tabs.query(queryTabsWithSounds, tabs => {
                var imagePrefix = options.isMuted ? 'mute' : 'sound';
                chrome.browserAction.setIcon({
                    path: {
                        '19': 'images/' + imagePrefix + '-19.png',
                        '38': 'images/' + imagePrefix + '-38.png'
                    }
                });
                options.isMuted ? muteTabs(tabs, options) : unMuteTabs(tabs, options);
        });
    }

    function muteTabs(tabs, options) {
        tabs.forEach(tab => {
            options.mutedTabs.push(tab);
            toggleMuteTab(tab, options.isMuted);
        });
        chrome.browserAction.setTitle({
            title: 'Unmute'
        });
    }

    function unMuteTabs(tabs, options) {
        options.mutedTabs.forEach(tab => {
            toggleMuteTab(tab, options.isMuted);
        });
        options.mutedTabs.length = 0;
        chrome.browserAction.setTitle({
            title: 'Mute'
        });
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

    function onUpdate(tabId, changeInfo, tab) {
        getFromStorage(function(options) {
            if (!options.isMuted) {
                return;
            }
            if (!options.mutedTabs.indexOf(tab) > -1) {
                options.mutedTabs.push(tab);
                saveToStorage(options);
            }
            toggleMuteTab(tab, true);
        });
    }

    chrome.browserAction.onClicked.addListener(onClick);
    chrome.tabs.onUpdated.addListener(onUpdate);
    initialize();
})();