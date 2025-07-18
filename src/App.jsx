import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ChatPopup from './ChatbotPopup'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
       <div className="relative min-h-screen bg-gray-50">
      <h1 className="text-center pt-10 text-3xl font-bold">Welcome to Dovetail</h1>
      <ChatPopup />
    </div>
    </>
  )
}

export default App
