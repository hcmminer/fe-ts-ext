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
        const translation = await bingTranslate(info.selectionText, "auto", "vi");

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "translateText" && message.text) {
        // Gọi API dịch
        bingTranslate(message.text, "auto", "vi")
            .then((translation) => {
                if (translation) {
                    // Gửi kết quả dịch về cho content script và gọi sendResponse để kết thúc
                    chrome.tabs.sendMessage(sender.tab.id, {
                        action: "displayTranslation",
                        text: translation.targetText,
                        sourceLang: translation.detectedLang,
                        transliteration: translation.transliteration
                    });

                    // Kết thúc bằng sendResponse
                    sendResponse({
                        success: true,
                        text: translation.targetText,
                        sourceLang: translation.detectedLang,
                        transliteration: translation.transliteration,
                    });
                } else {
                    console.error("Translation failed.");
                    sendResponse({ success: false, error: "Translation failed" });
                }
            })
            .catch((error) => {
                console.error("Error during translation:", error);
                sendResponse({ success: false, error: error.message });
            });

        // return true để giữ kênh mở
        return true;
    }
});


