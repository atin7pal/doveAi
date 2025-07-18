import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaMicrophone
} from "react-icons/fa";
import { motion } from "framer-motion";

// SpeechRecognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const socket = io("https://aiagent-ohdp.onrender.com/"); // Replace with your backend URL

export default function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    socket.emit("userMessage", input);
    setInput("");
  };

  useEffect(() => {
    socket.on("botMessage", (text) => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text, typing: true },
      ]);
    });

    return () => {
      socket.off("botMessage");
    };
  }, []);

  useEffect(() => {
    const last = messagesEndRef.current;
    if (last) last.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMicClick = () => {
    if (!recognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black text-white p-4 rounded-full shadow-xl hover:bg-gray-800 transition"
        >
          <FaRobot size={24} />
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="w-80 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between bg-black text-white px-4 py-3 rounded-t-lg">
            <span className="font-bold">Dovetail Assistant</span>
            <button onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-100">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-xs ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-black border"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 flex gap-2 border-t w-full">
          
            <button
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
            >
              <FaPaperPlane />
            </button>
            <button
              onClick={handleMicClick}
              className={`${
                isListening ? "bg-red-500" : "bg-black"
              } hover:bg-red-600 text-white px-3 py-2 rounded`}
              title="Speak"
            >
              <FaMicrophone />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
