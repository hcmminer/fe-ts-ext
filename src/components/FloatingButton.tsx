import React, {useState, useEffect, useCallback} from "react";
import {translate} from "../utils/translate";
import {splitIntoSentences} from "../utils/sentenceSplitter";

export const FloatingButton = () => {
    const [position, setPosition] = useState({x: window.innerWidth * 0.8, y: window.innerHeight * 0.5});
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({x: 0, y: 0});
    const [showSubButtons, setShowSubButtons] = useState(false);
    let timeoutId = null;

    const subButtonsData = Array(5).fill({
        bgColor: "bg-green-300",
        hoverColor: "hover:bg-green-400",
        iconPath: "M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003A8.967 8.967 0 0118 9.75V9A6 6 0 006.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53",
    });

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

    const handleMouseDown = (e) => {
        clearSubButtonsTimeout();
        setIsDragging(true);
        setStartPos({x: e.clientX - position.x, y: e.clientY - position.y});
    };

    const handleMouseMove = useCallback((e) => {
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
    const angleIncrement = Math.PI / (subButtonsData.length + 1);

    const [status, setStatus] = useState(null); // null, success, error

    const handleClickToTranslate = async () => {
        // Select all target elements within <pre> tags for translation
        const elementsToTranslate = Array.from(document.querySelectorAll('pre p')) as HTMLElement[];

        // Filter to get only top-level <p> elements that don't have the 'top-level-text' class or translated parents
        const topLevelTextElements = elementsToTranslate.filter(el => {
            return (
                el instanceof HTMLElement &&
                !el.classList.contains('top-level-text') &&
                !elementsToTranslate.some(parentEl => parentEl !== el && parentEl.contains(el))
            );
        });
        console.log(topLevelTextElements)

        // Mark and translate each top-level <p> element
        for (const element of topLevelTextElements) {
            try {
                element.classList.add('top-level-text'); // Add class for identification

                // Clone the node to avoid modifying the original element's content
                const cloneNode = element.cloneNode(true) as HTMLElement;
                cloneNode.querySelectorAll('.num-comment').forEach(child => {
                    if (/^\d+$/.test(child.textContent?.trim() || '')) {
                        child.remove()};
                });

                // Split the text by lines, filter out empty lines, and then join back
                cloneNode.innerText = cloneNode.innerText
                    .split('\n')              // Tách từng dòng
                    .filter(line => line.trim() !== '') // Loại bỏ các dòng trống (sau khi đã loại bỏ khoảng trắng)
                    .join('\n');              // Ghép lại thành đoạn văn với mỗi dòng là một câu mới

                // Split the paragraph into sentences
                const sentences = splitIntoSentences(cloneNode.innerText);

                // Clear the original content to replace it with sentence-by-sentence translations
                element.innerHTML = '';

                for (const sentence of sentences) {
                    if (sentence.trim()) {
                        // Translate each sentence individually
                        const response = await translate(sentence, 'en', 'vi', null, false);

                        // Create elements for the sentence and its translation
                        const sentenceElement = document.createElement('div');
                        sentenceElement.innerText = sentence;
                        sentenceElement.style.fontWeight = 'bold'; // Style original sentence

                        const translationElement = document.createElement('div');
                        translationElement.innerText = response.targetText;
                        Object.assign(translationElement.style, { color: 'gray', fontSize: '0.9em' }); // Style translated text

                        // Append both elements to the paragraph
                        element.appendChild(sentenceElement);
                        element.appendChild(translationElement);
                    }
                }
                setStatus("success");
            } catch (error) {
                setStatus(error);
                console.error(`Translation failed for element:`, error);
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
                 zIndex: 1000,
             }}
             onMouseDown={handleMouseDown}
        >
            {/* Main Button */}
            <div onClick={handleClickToTranslate}
                 className={`relative text-white shadow-xl flex items-center justify-center p-3 rounded-full 
                    ${status === 'success' ? 'bg-green-500' : ''}
                    ${status === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                     stroke="currentColor" className="w-6 h-6 transition-all duration-[0.6s]">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
            </div>

            {/* Sub Buttons */}
            {showSubButtons && subButtonsData.map((data, index) => {
                const angle = Math.PI / 2 + (index + 1) * angleIncrement;
                const xOffset = radius * Math.cos(angle);
                const yOffset = radius * Math.sin(angle);
                return (
                    <div
                        key={index}
                        className={`${data.bgColor} ${data.hoverColor} w-12 h-12 flex items-center justify-center rounded-full absolute transition-transform duration-300`}
                        style={{top: yOffset, left: xOffset}}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor"
                             className="w-6 h-6">
                            <path d={data.iconPath}/>
                        </svg>
                    </div>
                );
            })}
        </div>
    );

};
