import React, { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";

export interface TranslationBoxProps {
    text: string;
    sourceLang: string;
    transliteration?: string | null;
    onClose: () => void;
}

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

export const TranslationBox = () => {
    const [translation, setTranslation] = useState<TranslationBoxProps | null>(null);

    useEffect(() => {
        // Lắng nghe message từ background script
        const messageListener = (message) => {
            if (message.action === "displayTranslation") {
                setTranslation({
                    text: message.text,
                    sourceLang: message.sourceLang,
                    transliteration: message.transliteration,
                    onClose: () => setTranslation(null),
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
                <p><strong>Translation:</strong> {translation.text}</p>
                <p><strong>Detected Language:</strong> {translation.sourceLang}</p>
                {translation.transliteration && (
                    <p><strong>Transliteration:</strong> {translation.transliteration}</p>
                )}
            </CardContent>
        </Card>
    );
};
