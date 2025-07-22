import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { FaUserCircle } from "react-icons/fa";
import { GiArtificialIntelligence } from "react-icons/gi";
import icon from "/aicolorful.png";
import user from "/user.png";
import { div, img } from "framer-motion/client";

const socket = io("https://aiagent-ohdp.onrender.com/"); // Replace with your backend URL

export default function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Set up SpeechRecognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => setListening(true);
      recognitionRef.current.onend = () => setListening(false);

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + transcript);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (!listening) {
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop();
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    // Add typing animation
    setMessages((prev) => [...prev, { sender: "bot", typing: true }]);

    socket.emit("userMessage", input);
    setInput("");
  };

  useEffect(() => {
    socket.on("botMessage", (text) => {
      setMessages((prev) => {
        // Remove the last "typing" message and add the actual bot message
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.typing) updated.pop();
        return [...updated, { sender: "bot", text }];
      });
    });

    return () => {
      socket.off("botMessage");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black text-white p-4 rounded-full shadow-xl hover:bg-gray-800 transition"
        >
          <img src={icon} className="h-10" alt="" />
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="w-80 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-black text-white px-4 py-3 rounded-t-lg">
            <img src={icon} alt="" className="h-8" />
            <span className="font-bold">Dovetail Assistant</span>
            <button onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-100">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-end ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* AI Icon */}
                {msg.sender !== "user" && (
                  <img src={icon} alt="" className="w-6 mr-2" />
                )}

                <div
                  className={`px-3 py-2 rounded-lg max-w-xs text-wrap break-words ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white text-end h-full ml-4"
                      : "bg-white text-black text-start w-full h-full mr-4"
                  }`}
                >
                  {msg.typing ? (
                    <div className="flex space-x-1 py-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-700"></div>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>

                {/* User Icon */}
                {msg.sender === "user" && (
                  <img src={user} alt="" className="w-6 ml-2" />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Input Area */}
          <div className="p-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 rounded px-3 py-1 focus:outline-none"
              placeholder="Type a message..."
            />

            {/* Mic Button */}
            <button
              onClick={toggleListening}
              className={`p-3 rounded-full ${
                listening ? "bg-red-500 text-white" : "bg-gray-200 text-black"
              }`}
              title="Voice Input"
            >
              {listening ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-3 rounded-full"
            >
              <FaPaperPlane />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
