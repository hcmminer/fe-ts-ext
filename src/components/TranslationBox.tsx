import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";

export interface TranslationBoxProps {
    text: string;
    sourceLang: string;
    transliteration?: string | null;
    onClose: () => void;
}

export const TranslationBox = () => {
    const [translation, setTranslation] = useState<TranslationBoxProps | null>(null);

    useEffect(() => {
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message) => {
            if (message.action === "displayTranslation") {
                setTranslation({
                    text: message.text,
                    sourceLang: message.sourceLang,
                    transliteration: message.transliteration,
                    onClose: () => setTranslation(null),
                });
            }
        });
    }, []);

    document.addEventListener("click", (event) => {
        const selection = window.getSelection()?.toString().trim();

        // Kiểm tra xem người dùng có chọn văn bản không
        if (selection) {
            // Gửi văn bản đã chọn đến background script để dịch
            chrome.runtime.sendMessage({
                action: "translateText",
                text: selection
            });
        }
    });

    // Render only if translation data exists
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
