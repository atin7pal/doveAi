import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaMicrophone,
  FaMicrophoneSlash,
  FaUserCircle,
  FaStop,
} from "react-icons/fa";
import { GiArtificialIntelligence } from "react-icons/gi";
import { motion } from "framer-motion";
import icon from "/aicolorful.png";
import user from "/user.png";
import { SiTopcoder } from "react-icons/si";

const socket = io("https://aiagent-ohdp.onrender.com/");

export default function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Variants for animation
  const popupVariant = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.4, delay: 0.2 },
    },
    exit: { opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.3 } },
  };

  const itemVariant = (delay = 0) => ({
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, delay },
    },
  });

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setListening(true);
        setInput("Listening...");
      };

      recognitionRef.current.onend = () => {
        setListening(false);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript); // overwrite "Recording..." with actual speech
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setInput(""); // Optional: clear "Recording..." if no input received
    } else {
      recognitionRef.current.start();
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg, { sender: "bot", typing: true }]);
    socket.emit("userMessage", input);
    setInput("");
  };

  useEffect(() => {
    socket.on("botMessage", (text) => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.typing) updated.pop();
        return [...updated, { sender: "bot", text }];
      });
    });
    return () => socket.off("botMessage");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="bg-black text-white p-4 rounded-full shadow-xl hover:bg-gray-800 transition"
        >
          <img src={icon} className="h-10" alt="bot" />
        </motion.button>
      ) : (
        <motion.div
          variants={popupVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-80 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <motion.div
            variants={itemVariant(0.2)}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-between bg-black text-white px-4 py-3"
          >
            <img src={icon} alt="bot" className="h-8" />
            <span className="font-bold">Dovetail Ai</span>
            <button onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </motion.div>

          {/* Chat Messages */}
          <motion.div
            variants={itemVariant(0.3)}
            initial="hidden"
            animate="visible"
            className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-100"
          >
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                className={`flex items-end ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
              >
                {msg.sender !== "user" && (
                  <img src={icon} alt="bot" className="w-6 mr-2" />
                )}
                <div
                  className={`px-3 py-2 rounded-lg max-w-xs text-wrap break-words ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white ml-4 text-end"
                      : "bg-white text-black mr-4 text-start"
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
                {msg.sender === "user" && (
                  <img src={user} alt="user" className="w-6 ml-2" />
                )}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </motion.div>

          {/* Input Section */}
          <motion.div
            variants={itemVariant(0.4)}
            initial="hidden"
            animate="visible"
            className="p-3 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => !listening && setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 rounded px-3 py-1 focus:outline-none"
              placeholder={listening ? "Listening..." : "Type a message..."}
              disabled={listening}
            />

            <motion.button
              onClick={toggleListening}
              className={`p-3 rounded-full ${
                listening ? "bg-red-500 text-white" : "bg-gray-200 text-black"
              }`}
              whileTap={{ scale: 0.9 }}
              title={listening ? "Stop Listening" : "Start Voice Input"}
            >
              {listening ? <FaStop /> : <FaMicrophone />}
            </motion.button>

            <motion.button
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-3 rounded-full"
              whileTap={{ scale: 0.9 }}
            >
              <FaPaperPlane />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
