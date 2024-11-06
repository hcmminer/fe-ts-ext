import React, { useState, useEffect, useCallback } from "react";

export const FloatingButton = () => {
    const [position, setPosition] = useState({ x: window.innerWidth * 0.8, y: window.innerHeight * 0.5 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [showSubButtons, setShowSubButtons] = useState(false);
    let timeoutId = null;

    const subButtonsData = [
        { bgColor: "bg-green-300", hoverColor: "hover:bg-green-400", iconPath: "M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003A8.967 8.967 0 0118 9.75V9A6 6 0 006.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53" },
        { bgColor: "bg-green-300", hoverColor: "hover:bg-green-400", iconPath: "M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003A8.967 8.967 0 0118 9.75V9A6 6 0 006.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53" },
        { bgColor: "bg-green-300", hoverColor: "hover:bg-green-400", iconPath: "M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003A8.967 8.967 0 0118 9.75V9A6 6 0 006.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53" },
        { bgColor: "bg-green-300", hoverColor: "hover:bg-green-400", iconPath: "M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003A8.967 8.967 0 0118 9.75V9A6 6 0 006.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53" },
        { bgColor: "bg-green-300", hoverColor: "hover:bg-green-400", iconPath: "M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003A8.967 8.967 0 0118 9.75V9A6 6 0 006.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53" },
        { bgColor: "bg-green-300", hoverColor: "hover:bg-green-400", iconPath: "M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003A8.967 8.967 0 0118 9.75V9A6 6 0 006.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53" },

        // Add more sub-button data here as needed
    ];

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
        timeoutId = setTimeout(() => {
            setShowSubButtons(false);
        }, 1000);
    };

    const handleMouseDown = (e) => {
        clearSubButtonsTimeout();
        setIsDragging(true);
        setShowSubButtons(true);
        setStartPos({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const handleMouseMove = useCallback(
        (e) => {
            if (!isDragging) return;
            const newX = e.clientX - startPos.x;
            const newY = e.clientY - startPos.y;

            const maxX = window.innerWidth - 100;
            const maxY = window.innerHeight - 100;

            setPosition({
                x: Math.min(Math.max(0, newX), maxX),
                y: Math.min(Math.max(0, newY), maxY),
            });
            setShowSubButtons(true);
        },
        [isDragging, startPos]
    );

    const handleMouseUp = () => {
        clearSubButtonsTimeout();
        setIsDragging(false);
    };

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

    const radius = 80; // Adjust the radius as needed for spacing
    const totalButtons = subButtonsData.length - 2; // Exclude the first and last button from even spacing
    const angleStart = Math.PI / 2; // 90 degrees
    const angleEnd = 3 * Math.PI / 2; // 270 degrees
    const angleIncrement = (angleEnd - angleStart) / (totalButtons + 1); // Include the spaces for the first and last buttons

    return (
        <div
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
            <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="relative text-white shadow-xl flex items-center justify-center p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                     stroke="currentColor" className="w-6 h-6 group-hover:rotate-90 transition-all duration-[0.6s]">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
            </div>

            {/* Sub Buttons */}
            {subButtonsData.map((button, index) => {
                // Position the first button at 90 degrees (top) and the last at 270 degrees (bottom)
                const angle = index === 0
                    ? angleStart // First button at 90 degrees
                    : index === subButtonsData.length - 1
                        ? angleEnd // Last button at 270 degrees
                        : angleStart + angleIncrement * index; // Evenly spaced for middle buttons

                const xOffset = Math.cos(angle) * radius;
                const yOffset = Math.sin(angle) * radius;

                return (
                    <div
                        key={index}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        className={`absolute rounded-full transition-all transform 
                                    ${showSubButtons ? "scale-100 opacity-100" : "scale-0 opacity-0"}
                                    ${button.bgColor} ${button.hoverColor} p-2 hover:p-3 text-white shadow-lg`}
                        style={{
                            left: `${xOffset}px`,
                            top: `${yOffset}px`,
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d={button.iconPath}/>
                        </svg>
                    </div>
                );
            })}
        </div>
    );
};
