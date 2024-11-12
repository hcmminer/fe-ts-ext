// Background script to handle translation, TTS, and various event listeners.

// import browser, { Runtime, Tabs } from "webextension-polyfill";
// import translator from "../translator/index.js";
// import tts from "../tts/index.js";
// import * as util from "../util";
import { TranslationRequest, TranslationResponse} from "../types/translate";
import {bingTranslate} from "../utils/bingTranslate";

// Listen for messages from content and popup scripts
// function addMessageListener() {
//     chrome.runtime.onMessage.addListener(async (request: any, sender: Runtime.MessageSender, sendResponse: Function) => {
//         try {
//             console.log("resquest to background@", request)
//             switch (request.type) {
//                 case "translate":
//                     const translation = {};
//                     sendResponse(translation);
//                     break;
//             }
//         } catch (error) {
//             console.error("Message handling error:", error);
//         }
//         return true;
//     });
// }



chrome.runtime.onMessage.addListener((translationRequest: TranslationRequest, sender, sendResponse) => {
    if (translationRequest.action === "translate" && translationRequest.text) {
        // Gọi API dịch
        bingTranslate(translationRequest)
            .then((translation : TranslationResponse) => {
                if (translation) {
                    console.log("translation", translation)
                    // Gửi kết quả dịch về cho content script và gọi sendResponse để kết thúc
                    const translationResponse: TranslationResponse = {
                        success: true,
                        action: "displayTranslation",
                        targetText: translation.targetText,
                        sourceLang: translation.detectedLang,
                        transliteration: translation.transliteration
                    }
                    chrome.tabs.sendMessage(sender.tab.id, translationResponse);

                    // Kết thúc bằng sendResponse
                    sendResponse(translationResponse);
                } else {
                    const translationResponse: TranslationResponse = {
                        success: false,
                        error: "Translation failed"
                    }
                    sendResponse(translationResponse);
                }
            })
            .catch((error) => {
                const translationResponse: TranslationResponse = {
                    success: false,
                    error: "Translation failed"
                }
                sendResponse(translationResponse);
            });

        // return true để giữ kênh mở
        return true;
    }
});


