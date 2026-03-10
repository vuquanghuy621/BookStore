import React, { useState, useRef, useEffect } from "react";
import "./Chatbot.css";
import chatbotApi from "../../api/chatbotApi";

const Chatbot = () => {
    const [showChatbot, setShowChatbot] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Xin chào! 👋 Tôi là trợ lý ảo của BookStore. Tôi có thể giúp gì cho bạn về các loại sách hôm nay?", isUser: false }
    ]);
    const [inputVal, setInputVal] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const chatboxRef = useRef(null);
    const textareaRef = useRef(null);

    const toggleChatbot = () => {
        setShowChatbot(!showChatbot);
        document.body.classList.toggle("show-chatbot");
    };

    const handleInputChange = (e) => {
        setInputVal(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const generateResponse = async (userMessage) => {
        try {
            setIsLoading(true);
            const response = await chatbotApi.chat(userMessage);
            const botResponse = response.reply;

            setMessages(prev => [
                ...prev,
                { text: botResponse, isUser: false }
            ]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [
                ...prev,
                { text: "Xin lỗi, hiện tại tôi đang gặp sự cố. Bạn vui lòng thử lại sau nhé!", isUser: false, isError: true }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => {
        const userMessage = inputVal.trim();
        if (!userMessage) return;

        // Add user message
        setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
        setInputVal("");
        if (textareaRef.current) {
            textareaRef.current.style.height = '50px';
        }

        // Simulate "Thinking..."
        // In real loading state, we trust isLoading 
        generateResponse(userMessage);
    };

    // Auto scroll to bottom
    useEffect(() => {
        if (chatboxRef.current) {
            chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
        }
    }, [messages, isLoading, showChatbot]); // Added showChatbot to scroll when opened

    // Clean up body class on unmount
    useEffect(() => {
        return () => {
            document.body.classList.remove("show-chatbot");
        }
    }, []);

    return (
        <>
            <button className="chatbot-toggler" onClick={toggleChatbot}>
                {showChatbot ? (
                    <span className="material-symbols-rounded">close</span>
                ) : (
                    <span className="material-symbols-rounded">chat_bubble</span>
                )}
            </button>

            <div className={`chatbot ${showChatbot ? 'active' : ''}`}>
                <header>
                    <div className="header-content">
                        <span className="material-symbols-rounded">forum</span>
                        <h2>Trợ lý ảo BookStore</h2>
                    </div>
                    <span className="close-btn material-symbols-rounded" onClick={toggleChatbot}>close</span>
                </header>
                <div className="chatbox" ref={chatboxRef}>
                    {messages.map((msg, index) => (
                        <li key={index} className={`chat ${msg.isUser ? 'outgoing' : 'incoming'} ${msg.isError ? 'error' : ''}`}>
                            {!msg.isUser && <span className="material-symbols-rounded">smart_toy</span>}
                            <p>
                                {msg.text}
                            </p>
                        </li>
                    ))}
                    {isLoading && (
                        <li className="chat incoming">
                            <span className="material-symbols-rounded">smart_toy</span>
                            <div className="typing-indicator" style={{
                                background: '#f3f4f6',
                                padding: '12px 18px',
                                borderRadius: '20px 20px 20px 5px',
                                border: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}>
                                <span style={{ width: '6px', height: '6px', background: '#999', borderRadius: '50%', animation: 'typing 1s infinite alternate' }}></span>
                                <span style={{ width: '6px', height: '6px', background: '#999', borderRadius: '50%', animation: 'typing 1s infinite alternate 0.3s' }}></span>
                                <span style={{ width: '6px', height: '6px', background: '#999', borderRadius: '50%', animation: 'typing 1s infinite alternate 0.6s' }}></span>
                            </div>
                        </li>
                    )}
                </div>
                <div className="chat-input">
                    <textarea
                        ref={textareaRef}
                        placeholder="Nhập tin nhắn..."
                        spellCheck="false"
                        required
                        value={inputVal}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 800) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    ></textarea>
                    <span
                        id="send-btn"
                        className="material-symbols-rounded"
                        onClick={handleSend}
                        style={{ visibility: inputVal.trim() ? 'visible' : 'hidden' }}
                    >
                        send
                    </span>
                </div>
            </div>
            {/* Inline animation for typing dots */}
            <style>
                {`
               @keyframes typing {
                   to { opacity: 0.3; transform: translateY(-3px); }
               }
               `}
            </style>
        </>
    );
};

export default Chatbot;
