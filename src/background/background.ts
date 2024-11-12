// Background script to handle translation, TTS, and various event listeners.

import browser, { Runtime, Tabs } from "webextension-polyfill";
import translator from "../translator/index.js";
import tts from "../tts/index.js";
import * as util from "../util";
import {PlayTtsRequest, TranslationRequest} from "../types/translate";

let setting: any;
let recentTranslated: string = "";
const introSiteUrl = "https://github.com/ttop32/MouseTooltipTranslator/blob/main/doc/intro.md#how-to-use";
let recentRecord: Record<string, any> = {};

(async function backgroundInit() {
    try {
        injectContentScriptForAllTabs();
        addInstallUrl(introSiteUrl);
        await getSetting();
        setupEventListeners();
    } catch (error) {
        console.error("Initialization error:", error);
    }
})();

// Setup all event listeners
function setupEventListeners() {
    addMessageListener();
    addCopyRequestListener();
    addSaveTranslationKeyListener();
    addTabSwitchEventListener();
    addPdfFileTabListener();
    addSearchBarListener();
}

// Listen for messages from content and popup scripts
function addMessageListener() {
    chrome.runtime.onMessage.addListener(async (request: any, sender: Runtime.MessageSender, sendResponse: Function) => {
        try {
            console.log("resquest to background@", request)
            switch (request.type) {
                case "translate":
                    const translation = await translateWithReverse(request.data);
                    sendResponse(translation);
                    break;
                case "tts":
                    await playTtsQueue(request.data);
                    sendResponse({});
                    break;
                case "stopTTS":
                    stopTts(request.data.timestamp);
                    sendResponse({});
                    break;
                case "recordTooltipText":
                    recordHistory(request.data);
                    updateCopyContext(request.data);
                    sendResponse({});
                    break;
                case "requestBase64":
                    const base64Url = await util.getBase64(request.url);
                    sendResponse({ base64Url });
                    break;
                case "createOffscreen":
                    await util.createOffscreen();
                    sendResponse({});
                    break;
            }
        } catch (error) {
            console.error("Message handling error:", error);
        }
        return true;
    });
}

// Translation functionality
async function translate({ text, sourceLang, targetLang, engine }: TranslationRequest) {
    const translatorEngine = engine || setting["translatorVendor"];
    return (
        (await getTranslateCached(text, sourceLang, targetLang, translatorEngine)) || {
            targetText: `${translatorEngine} is broken`,
            transliteration: "",
            sourceLang: "",
            targetLang: setting["translateTarget"],
            isBroken: true,
        }
    );
}

const getTranslateCached = util.cacheFn(getTranslate);

async function getTranslate(text: string, sourceLang: string, targetLang: string, engine: string) {
    return translator["google"].translate(text, sourceLang, targetLang);
}

async function translateWithReverse(request: TranslationRequest) {
    const { text, sourceLang, targetLang, reverseLang, engine } = request;
    let response = await translate({ text, sourceLang, targetLang, engine });
    if (
        !response.isBroken &&
        targetLang === response.sourceLang &&
        reverseLang &&
        reverseLang !== targetLang
    ) {
        response = await translate({ text, sourceLang: response.sourceLang, targetLang: reverseLang, engine });
    }
    return response;
}

// Settings management
async function getSetting() {
    setting = await util.loadSetting();
}

function recordHistory({
                           sourceText,
                           sourceLang,
                           targetText,
                           targetLang,
                           dict,
                           actionType,
                       }: Record<string, any>) {
    recentRecord = { sourceText, sourceLang, targetText, targetLang, dict, actionType, date: util.getDateNow(), translator: setting["translatorVendor"] };
    insertHistory();
}

function insertHistory(actionType?: string) {
    const { historyRecordActions, historyList } = setting;
    if (historyRecordActions.includes(recentRecord.actionType) || actionType) {
        const newRecord = actionType ? util.concatJson(recentRecord, { actionType }) : recentRecord;
        const prevRecord = historyList[0];
        if (util.getRecordID(newRecord) === util.getRecordID(prevRecord)) return;
        if (newRecord.actionType === "select" && newRecord.sourceText.includes(historyList?.[0]?.sourceText)) {
            historyList.shift();
        }
        historyList.unshift(newRecord);
        if (historyList.length > 10000) historyList.pop();
        setting.save();
    }
}

function addSaveTranslationKeyListener() {
    util.addCommandListener("save-translation", () => insertHistory("shortcutkey"));
}

// Copy functionality
function addCopyRequestListener() {
    util.addContextListener("copy", requestCopyForTargetText);
    util.addCommandListener("copy-translated-text", requestCopyForTargetText);
}

async function updateCopyContext({ targetText }: { targetText: string }) {
    await removeContext("copy");
    browser.contextMenus.create({
        id: "copy",
        title: "Copy : " + util.truncate(targetText, 20),
        contexts: ["all"],
        visible: true,
    });
    recentTranslated = targetText;
}

async function removeContext(id: string) {
    try {
        await browser.contextMenus.remove(id);
    } catch {}
}

async function removeContextAll(id?) {
    await browser.contextMenus.removeAll();
}

function requestCopyForTargetText() {
    util.sendMessageToCurrentTab({ type: "CopyRequest", text: recentTranslated });
}

// Content script reinjection after upgrade or install
// Content script reinjection after upgrade or install
async function injectContentScriptForAllTabs() {
    browser.runtime.onInstalled.addListener(async (details) => {
        if (util.checkInDevMode()) return;

        // Loop through each content script specified in the manifest
        for (const cs of browser.runtime.getManifest().content_scripts || []) {
            for (const tab of await browser.tabs.query({ url: cs.matches })) {
                // Skip if the tab URL matches specific system pages
                if (/^(chrome:\/\/|edge:\/\/|file:\/\/|https:\/\/chrome\.google\.com|https:\/\/chromewebstore\.google\.com|chrome-extension:\/\/)/.test(tab.url)) continue;

                try {
                    // Inject only JavaScript, as CSS is not needed
                    if (cs.js) {
                        await browser.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: cs.js,
                        });
                    }
                } catch (error) {
                    console.error("Error injecting content script:", error);
                }
            }
        }
    });
}


function addInstallUrl(url: string) {
    browser.runtime.onInstalled.addListener(details => {
        if (details.reason === "install") {
            browser.tabs.create({ url });
        }
    });
}

// TTS functionality
async function playTtsQueue({ sourceText, sourceLang, targetText, targetLang, voiceTarget, voiceRepeat, timestamp }: PlayTtsRequest) {
    const ttsTarget = voiceTarget || setting["voiceTarget"];
    const ttsRepeat = Number(voiceRepeat || setting["voiceRepeat"]);
    for (let i = 0; i < ttsRepeat; i++) {
        switch (ttsTarget) {
            case "source":
                await playTts(sourceText, sourceLang, timestamp);
                break;
            case "target":
                await playTts(targetText, targetLang, timestamp);
                break;
            case "sourcetarget":
                await playTts(sourceText, sourceLang, timestamp);
                await playTts(targetText, targetLang, timestamp);
                break;
            case "targetsource":
                await playTts(targetText, targetLang, timestamp);
                await playTts(sourceText, sourceLang, timestamp);
                break;
        }
    }
}

function stopTts(timestamp = Date.now()) {
    Object.values(tts).forEach(({stopTTS}) => stopTTS(timestamp));
}

async function playTts(text: string, lang: string, timestamp: number) {
    const { voiceVolume, voiceRate } = setting;
    const voiceFullName = setting[`ttsVoice_${lang}`];
    const isExternalTts = /^(BingTTS|GoogleTranslateTTS)/.test(voiceFullName);
    const [engine, voice] = isExternalTts ? voiceFullName.split("_") : ["BrowserTTS", voiceFullName];
    await tts[engine].playTTS(text, voice, lang, voiceRate, voiceVolume, timestamp);
}

// Detect tab switch to stop TTS
function addTabSwitchEventListener() {
    browser.tabs.onActivated.addListener(handleTabSwitch);
    browser.tabs.onRemoved.addListener(handleTabSwitch);
    browser.tabs.onUpdated.addListener(handleTabSwitch);
}

function handleTabSwitch() {
    stopTts();
    removeContextAll();
}

// PDF file detection and handling
function addPdfFileTabListener() {
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status !== "loading" || setting?.detectPDF === "false") return;
        openPDFViewer(changeInfo?.url || "", tabId);
    });
}

async function openPDFViewer(url: string, tabId: number) {
    if (!isLocalPdfUrl(url)) return;
    browser.tabs.update(tabId, {
        url: browser.runtime.getURL(`/pdfjs/web/viewer.html?file=${encodeURIComponent(url)}`)
    });
}

function isLocalPdfUrl(url: string): boolean {
    return /^file:\/\/.*\.pdf$/.test(url.toLowerCase());
}

// Search bar listener for translations
function addSearchBarListener() {
    browser.omnibox.setDefaultSuggestion({ description: "search with translator" });
    browser.omnibox.onInputEntered.addListener(async (text) => {
        const result = await translateWithReverse({ text, sourceLang: "auto", targetLang: setting["writingLanguage"], reverseLang: setting["translateTarget"] });
        browser.search.query({ text: result.isBroken ? text : result.targetText });
    });
}


// chrome.runtime.onInstalled.addListener(() => {
//     chrome.contextMenus.create({
//         id: "translateText",
//         title: "Translate selected text",
//         contexts: ["selection"]
//     });
// });
//
// // Lắng nghe sự kiện khi người dùng chọn tùy chọn "Translate selected text"
// chrome.contextMenus.onClicked.addListener(async (info, tab) => {
//     if (info.menuItemId === "translateText" && info.selectionText) {
//         // Dịch văn bản đã chọn
//         const translationRequest : TranslationRequest = {sourceText : info.selectionText, sourceLang : "auto" , targetLang: "vi"};
//         const bingTranslateResponse = await bingTranslate(translationRequest);
//
//         // Kiểm tra xem có nhận được kết quả dịch không
//         if (bingTranslateResponse) {
//             // Gửi kết quả dịch đến content script
//             const translationResponse = await bingTranslate(translationRequest);
//             chrome.tabs.sendMessage(tab.id, bingTranslateResponse);
//         }
//     }
// });
//
// chrome.runtime.onMessage.addListener((translationRequest: TranslationRequest, sender, sendResponse) => {
//     if (translationRequest.action === "translateText" && translationRequest.sourceText) {
//         // Gọi API dịch
//         bingTranslate(translationRequest)
//             .then((translation : TranslationResponse) => {
//                 if (translation) {
//                     console.log("translation", translation)
//                     // Gửi kết quả dịch về cho content script và gọi sendResponse để kết thúc
//                     const translationResponse: TranslationResponse = {
//                         success: true,
//                         action: "displayTranslation",
//                         targetText: translation.targetText,
//                         sourceLang: translation.detectedLang,
//                         transliteration: translation.transliteration
//                     }
//                     chrome.tabs.sendMessage(sender.tab.id, translationResponse);
//
//                     // Kết thúc bằng sendResponse
//                     sendResponse(translationResponse);
//                 } else {
//                     const translationResponse: TranslationResponse = {
//                         success: false,
//                         error: "Translation failed"
//                     }
//                     sendResponse(translationResponse);
//                 }
//             })
//             .catch((error) => {
//                 const translationResponse: TranslationResponse = {
//                     success: false,
//                     error: "Translation failed"
//                 }
//                 sendResponse(translationResponse);
//             });
//
//         // return true để giữ kênh mở
//         return true;
//     }
// });


