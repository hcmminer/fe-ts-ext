import React, {useEffect, useState, useCallback} from "react";
import {Card, CardHeader, CardContent, CardTitle} from "../components/ui/card";
import {TranslationResponse} from "../types/translate";
import {debounce} from "../utils/debounce";

export const TranslationBox = () => {
    const [translation, setTranslation] = useState<TranslationResponse>(null);

    useEffect(() => {
        // Lắng nghe message từ background script
        const messageListener = (message: { action: string; targetText: string; sourceLang: string; transliteration: string; }) => {
            if (message.action === "displayTranslation") {
                setTranslation({
                    targetText: message.targetText,
                    sourceLang: message.sourceLang,
                    transliteration: message.transliteration,
                });
            }
        };

        // Đăng ký listener
        chrome.runtime.onMessage.addListener(messageListener);

        // Hủy listener khi component bị unmounted
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    // Debounced function to handle document click events
    const handleDocumentClick = useCallback(
        debounce((event) => {
            const selection = window.getSelection()?.toString().trim();
            if (selection && chrome.runtime) {
                // Kiểm tra xem extension context có hợp lệ không
                try {
                    chrome.runtime.sendMessage({
                        action: "translateText",
                        text: selection,
                    });
                } catch (error) {
                    console.error("Error sending message to background script:", error);
                }
            }
        }, 300), // delay của debounce là 300ms, có thể điều chỉnh
        []
    );

    useEffect(() => {
        // Đăng ký sự kiện click
        document.addEventListener("click", handleDocumentClick);

        // Hủy đăng ký sự kiện click khi component unmounts
        return () => {
            document.removeEventListener("click", handleDocumentClick);
        };
    }, [handleDocumentClick]);

    // Chỉ render khi có dữ liệu dịch
    if (!translation) return null;

    return (
        <Card className="fixed bottom-5 right-5 max-w-sm z-50 shadow-lg">
            <CardHeader>
                <CardTitle>Translation</CardTitle>
            </CardHeader>
            <CardContent>
                <p><strong>Translation:</strong> {translation.targetText}</p>
                <p><strong>Detected Language:</strong> {translation.sourceLang}</p>
                {translation.transliteration && (
                    <p><strong>Transliteration:</strong> {translation.transliteration}</p>
                )}
            </CardContent>
        </Card>
    );
};
