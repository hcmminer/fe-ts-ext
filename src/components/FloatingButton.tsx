import React, { useState, useEffect, useCallback } from "react";
import { splitIntoSentences } from "../utils/sentenceSplitter";
import { Icons } from "./icons";

// Đảm bảo rằng bạn đã có `TranslationBoxProps` định nghĩa kiểu dữ liệu
export interface TranslationBoxProps {
    text: string;
    sourceLang: string;
    transliteration?: string | null;
}

function debounce(func: (event: any) => void, delay: number) {
    let timer: NodeJS.Timeout;
    return function (...args: any) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

export const FloatingButton = () => {
    const [position, setPosition] = useState({ x: window.innerWidth * 0.8, y: window.innerHeight * 0.5 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [showSubButtons, setShowSubButtons] = useState(false);
    const [status, setStatus] = useState<"success" | "error" | null>(null);

    let timeoutId: NodeJS.Timeout | null = null;

    const clearSubButtonsTimeout = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    const handleMouseEnter = () => {
        clearSubButtonsTimeout();
        setShowSubButtons(true);
    };

    const handleMouseLeave = () => {
        clearSubButtonsTimeout();
        timeoutId = setTimeout(() => setShowSubButtons(false), 1000);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        clearSubButtonsTimeout();
        setIsDragging(true);
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;

        const maxX = window.innerWidth - 100;
        const maxY = window.innerHeight - 100;

        setPosition({
            x: Math.min(Math.max(0, e.clientX - startPos.x), maxX),
            y: Math.min(Math.max(0, e.clientY - startPos.y), maxY),
        });
    }, [isDragging, startPos]);

    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            return () => {
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove]);

    const radius = 80;
    const angleIncrement = Math.PI / 2;

    // Cập nhật `handleDocumentTranslate` để trả về Promise
    const handleDocumentTranslate = useCallback((selectionText: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            const debouncedHandler = debounce(() => {
                if (selectionText && chrome.runtime) {
                    try {
                        console.log("Sending message to background script with text:", selectionText);
                        chrome.runtime.sendMessage(
                            {
                                action: "translateText",
                                text: selectionText,
                            },
                            (response) => {
                                console.log("Received translation response:", response);
                                if (response && response.text) {
                                    resolve(response); // Trả về kết quả dịch
                                } else {
                                    reject("No translation result");
                                }
                            }
                        );
                    } catch (error) {
                        console.error("Error in sending message:", error);
                        reject(error);
                    }
                }
            }, 300);
            debouncedHandler();
        });
    }, []);

    // Cập nhật `handleClickToTranslate` để sử dụng `await` với `handleDocumentTranslate`
    const handleClickToTranslate = async () => {
        const elementsToTranslate = Array.from(document.querySelectorAll('pre p')) as HTMLElement[];
        const topLevelTextElements = elementsToTranslate.filter(el => (
            el instanceof HTMLElement &&
            !el.classList.contains('top-level-text') &&
            !elementsToTranslate.some(parentEl => parentEl !== el && parentEl.contains(el))
        ));

        for (const element of topLevelTextElements) {
            try {
                console.log("Starting translation for element:", element);
                element.classList.add('top-level-text');
                const cloneNode = element.cloneNode(true) as HTMLElement;
                cloneNode.querySelectorAll('.num-comment').forEach(child => {
                    if (/^\d+$/.test(child.textContent?.trim() || '')) {
                        child.remove();
                    }
                });

                cloneNode.innerText = cloneNode.innerText
                    .split('\n')              // Tách từng dòng
                    .filter(line => line.trim() !== '') // Loại bỏ các dòng trống (sau khi đã loại bỏ khoảng trắng)
                    .join('\n');

                const sentences = splitIntoSentences(cloneNode.innerText);
                // remove original dom
                element.innerHTML = '';

                // Duyệt qua từng câu và chờ dịch xong
                for (let i = 0; i < sentences.length; i++) {
                    const sentence = sentences[i];
                    if (sentence.trim()) {
                        console.log("Translating sentence:", sentence);
                        // Chờ dịch xong cho từng câu
                        const translation = await handleDocumentTranslate(sentence);
                        console.log("Translation completed:", translation);

                        const sentenceElement = document.createElement('div');
                        sentenceElement.innerText = sentence;
                        sentenceElement.style.fontWeight = 'bold';

                        const translationElement = document.createElement('div');

                        // Add "\n\n" only for the last sentence
                        const translationText = (i === sentences.length - 1)
                            ? translation.text  + "\n\n"
                            : translation.text ;
                        translationElement.innerText = translationText || "Đang dịch..."; // Hiển thị bản dịch
                        Object.assign(translationElement.style, { color: 'gray', fontSize: '0.9em' });

                        element.appendChild(sentenceElement);
                        element.appendChild(translationElement);
                    }
                }
                setStatus("success");
            } catch (error) {
                setStatus("error");
                console.error("Translation failed for element:", error);
            }
        }
    };


    return (
        <div onMouseEnter={handleMouseEnter}
             onMouseLeave={handleMouseLeave}
             className={`fixed ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
             style={{
                 left: `${position.x}px`,
                 top: `${position.y}px`,
                 touchAction: "none",
                 userSelect: "none",
                 zIndex: 99999,
             }}
             onMouseDown={handleMouseDown}
        >
            <div onClick={handleClickToTranslate}
                 className={`relative text-white shadow-xl flex items-center justify-center p-3 rounded-full 
                    ${status === 'success' ? 'bg-green-500' : ''}
                    ${status === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}` }
            >
                <Icons.main />
            </div>

            {/* Sub Buttons */}
            {showSubButtons && (
                <>
                    <div
                        className="bg-green-300 hover:bg-green-400 w-12 h-12 flex items-center justify-center rounded-full absolute transition-transform duration-300"
                        style={{
                            top: radius * Math.sin(Math.PI / 2 + angleIncrement * 1),
                            left: radius * Math.cos(Math.PI / 2 + angleIncrement * 1)
                        }}
                    >
                        <Icons.notify/>
                    </div>
                    <div
                        className="bg-green-300 hover:bg-green-400 w-12 h-12 flex items-center justify-center rounded-full absolute transition-transform duration-300"
                        style={{
                            top: radius * Math.sin(Math.PI / 2 + angleIncrement * 2),
                            left: radius * Math.cos(Math.PI / 2 + angleIncrement * 2)
                        }}
                    >
                        <Icons.notify/>
                    </div>
                </>
            )}
        </div>
    );
};
