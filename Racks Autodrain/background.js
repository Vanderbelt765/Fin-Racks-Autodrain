const ALARM_NAME = "racks-autodrain-next-open";

function getRandomIntervalMinutes() {
    const minHours = 2;
    const maxHours = 3;
    const hours = Math.random() * (maxHours - minHours) + minHours;
    return hours * 60;
}

async function scheduleNextOpen() {
    const delayMinutes = getRandomIntervalMinutes();

    await chrome.alarms.clear(ALARM_NAME);
    chrome.alarms.create(ALARM_NAME, {
        delayInMinutes: delayMinutes
    });

    console.log(
        `Next Racks tab scheduled in approximately ${Math.round(delayMinutes / 60 * 10) / 10} hours`
    );
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM_NAME) return;

    chrome.tabs.create({ url: "https://throne.com/racksfindom" })
        .catch((error) => console.error("Could not open Throne tab:", error))
        .finally(() => scheduleNextOpen());
});

chrome.runtime.onInstalled.addListener(() => {
    scheduleNextOpen();
});

chrome.runtime.onStartup.addListener(() => {
    scheduleNextOpen();
});

// Also schedule when the service worker is first loaded.
scheduleNextOpen();