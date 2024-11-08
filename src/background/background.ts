// Khởi tạo menu ngữ cảnh khi extension được cài đặt
import {bingTranslate} from "../utils/bingTranslate";

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
        const translation = await bingTranslate(info.selectionText, "auto", "en");

        // Kiểm tra xem có nhận được kết quả dịch không
        if (translation) {
            // Gửi kết quả dịch đến content script
            chrome.tabs.sendMessage(tab.id, {
                action: "displayTranslation",
                text: translation.targetText,
                sourceLang: translation.detectedLang,
                transliteration: translation.transliteration
            });
        } else {
            console.error("Translation failed.");
        }
    }
});
