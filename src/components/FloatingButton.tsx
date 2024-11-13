import React, { useState, useEffect, useCallback, useRef } from "react";
import { splitIntoSentences } from "../utils/sentenceSplitter";
import { Icons } from "./icons";
import {TranslationRequest, TranslationResponse} from "../types/translate";
import { debounce } from "../utils/debounce";

export const FloatingButton = () => {
    const radius = 80;
    const angleIncrement = Math.PI / 2;
    const [position, setPosition] = useState({ x: window.innerWidth * 0.8, y: window.innerHeight * 0.5 });
    const [isDragging, setIsDragging] = useState(false);
    const [showSubButtons, setShowSubButtons] = useState(false);
    const [status, setStatus] = useState<"success" | "error" | null>(null);
    const [isTranslating, setIsTranslating] = useState(false); // Trạng thái kiểm tra đang dịch hay không

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const startPos = useRef({ x: 0, y: 0 });

    const clearSubButtonsTimeout = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleMouseActions = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (e.type === "mouseenter") {
            clearSubButtonsTimeout();
            setShowSubButtons(true);
        }
        if (e.type === "mouseleave") {
            timeoutRef.current = setTimeout(() => setShowSubButtons(false), 1000);
        }
        if (e.type === "mousedown") {
            clearSubButtonsTimeout();
            setIsDragging(true);
            startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        }
        if (e.type === "mouseup") {
            setIsDragging(false);
        }
        if (e.type === "mousemove" && isDragging) {
            setPosition(() => ({
                x: Math.min(Math.max(0, e.clientX - startPos.current.x), window.innerWidth - 100),
                y: Math.min(Math.max(0, e.clientY - startPos.current.y), window.innerHeight - 100),
            }));
        }
    }, [isDragging, position]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseActions);
            window.addEventListener("mouseup", handleMouseActions);
            return () => {
                window.removeEventListener("mousemove", handleMouseActions);
                window.removeEventListener("mouseup", handleMouseActions);
            };
        }
    }, [isDragging, handleMouseActions]);

    // Cập nhật hàm handleDocumentTranslate để trả về Promise<TranslationResponse>
    const handleDocumentTranslate = useCallback((selectionText: string): Promise<TranslationResponse> => {
        return new Promise((resolve, reject) => {
            const debouncedHandler = debounce(() => {
                if (selectionText && chrome.runtime) {
                    try {
                        const translationRequest: TranslationRequest = {type: "translateText", text: selectionText, sourceLang: "auto", targetLang: "vi"}
                        chrome.runtime.sendMessage(
                            translationRequest,
                            (response : TranslationResponse) => {
                                if (response && response.targetText) {
                                    resolve(response);
                                } else {
                                    reject("No translation result");
                                }
                            }
                        );
                    } catch (error) {
                        reject(error);
                    }
                }
            }, 300);
            debouncedHandler();
        });
    }, []);

    // Sử dụng await để gọi handleDocumentTranslate và kiểm tra translation
    const handleClickToTranslate = async () => {
        if (isTranslating) {
            // Nếu đang dịch, không làm gì cả
            return;
        }

        setIsTranslating(true); // Bắt đầu quá trình dịch
        setStatus(null); // Đặt lại trạng thái

        const elementsToTranslate = Array.from(document.querySelectorAll("pre p")) as HTMLElement[];
        const topLevelTextElements = elementsToTranslate.filter(el =>
            el instanceof HTMLElement && !el.classList.contains("top-level-text") &&
            !elementsToTranslate.some(parentEl => parentEl !== el && parentEl.contains(el))
        );

        for (const element of topLevelTextElements) {
            try {
                element.classList.add("top-level-text");
                const cloneNode = element.cloneNode(true) as HTMLElement;
                cloneNode.querySelectorAll(".num-comment").forEach(child => child.remove());
                cloneNode.innerText = cloneNode.innerText.split("\n").filter(line => line.trim()).join("\n");

                const sentences = splitIntoSentences(cloneNode.innerText);
                element.innerHTML = "";

                for (let i = 0; i < sentences.length; i++) {
                    const translation : TranslationResponse = await handleDocumentTranslate(sentences[i]);

                    if (translation && translation.targetText) {
                        const sentenceElement = document.createElement("div");
                        sentenceElement.innerText = sentences[i];
                        sentenceElement.style.fontWeight = "bold";

                        const translationElement = document.createElement("div");
                        translationElement.innerText = translation.targetText + (i === sentences.length - 1 ? "\n\n" : "");
                        Object.assign(translationElement.style, { color: "gray", fontSize: "0.9em" });

                        element.appendChild(sentenceElement);
                        element.appendChild(translationElement);
                    } else {
                        console.error("Translation not available for:", sentences[i]);
                    }
                }
                setStatus("success");
            } catch (error) {
                setStatus("error");
                console.error("Translation failed:", error);
            }
        }
        setIsTranslating(false); // Đặt lại trạng thái khi dịch hoàn tất
    };

    return (
        <div onMouseEnter={handleMouseActions}
             onMouseLeave={handleMouseActions}
             onMouseDown={(e) => handleMouseActions(e as React.MouseEvent)}
             className={`fixed ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
             style={{ left: `${position.x}px`, top: `${position.y}px`, touchAction: "none", userSelect: "none", zIndex: 99999 }}
        >
            <div onClick={handleClickToTranslate}
                 className={`relative text-white shadow-xl flex items-center justify-center p-3 rounded-full 
                    ${status === "success" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-gradient-to-r from-cyan-500 to-blue-500"}`}
            >
                <Icons.main />
            </div>

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
