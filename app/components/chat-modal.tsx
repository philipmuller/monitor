"use client";

import React, { useState, FormEvent, ChangeEvent } from 'react';
//import { cookies } from 'next/headers';
import { OpenAIEngine } from '../engine/ai-engine';
import { revalidatePath } from 'next/cache';

export default function ChatModal({ convo, request }: { convo: string[], request: (text: string) => Promise<string> }) {
  const [messages, setMessages] = useState<string[]>([...convo]);
  const [message, setMessage] = useState<string>('');

//   function createSession(): string {
//     const cookiesList = cookies();
//     const sessionId = cookiesList.get('session_id');

//     if (!sessionId) {
//       const newSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
//       cookiesList.set('session_id', newSessionId);
//       return newSessionId;
//     } else {
//       return sessionId.value;
//     }
//   }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const msg = message;
    setMessages([...messages, msg]);
    setMessage('');

    const response = await request(msg);
    setMessages([...messages, response]);  

  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  return (
    <div className="backdrop-blur-md bg-white/30 fixed bottom-0 left-0 right-0">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-end font-mono text-sm lg:flex">
        {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
        ))}
      </div>
      <form 
      onSubmit={handleSubmit} 
      className="p-10 flex flex-row gap-6  p-4">
        <input
          name="message"
          value={message}
          onChange={handleChange}
          className='w-full border border-gray-300 p-2 rounded-full bg-transparent focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent'
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}