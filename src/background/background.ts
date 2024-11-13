// Khởi tạo menu ngữ cảnh khi extension được cài đặt
import {bingTranslate} from "../utils/bingTranslate";
import {TranslationRequest, TranslationResponse} from "../types/translate";
import {googleTranslateV1} from "../utils/translate";

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "translateText",
        title: "Translate selected text",
        contexts: ["selection"]
    });
});

// Lắng nghe sự kiện khi người dùng chọn tùy chọn "Translate selected text"
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "translateText" && info.selectionText) {
        // Dịch văn bản đã chọn
        const translationRequest : TranslationRequest = {text : info.selectionText, sourceLang : "auto" , targetLang: "vi"};
        const bingTranslateResponse = await bingTranslate(translationRequest);

        // Kiểm tra xem có nhận được kết quả dịch không
        if (bingTranslateResponse) {
            // Gửi kết quả dịch đến content script
            const translationResponse = await bingTranslate(translationRequest);
            chrome.tabs.sendMessage(tab.id, bingTranslateResponse);
        }
    }
});

chrome.runtime.onMessage.addListener((translationRequest: TranslationRequest, sender, sendResponse) => {
    if (translationRequest.type === "translateText" && translationRequest.text) {
        // Call translation API
        googleTranslateV1(translationRequest)
            .then((translation: TranslationResponse) => {
                sendResponse({
                    success: !!translation,
                    action: translation ? "displayTranslation" : undefined,
                    targetText: translation?.targetText,
                    sourceLang: translation?.detectedLang,
                    transliteration: translation?.transliteration,
                    error: translation ? undefined : "Translation failed"
                });
            })
            .catch(() => sendResponse({ success: false, error: "Translation failed" }));

        // Keep the message channel open for async response
        return true;
    }
});



