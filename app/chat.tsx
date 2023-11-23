"use client";

import React, { useState, FormEvent, ChangeEvent } from 'react';

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessages([...messages, message]);
    setMessage('');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  return (
    <main className="flex min-h-screen bg-white text-slate-800 flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-end font-mono text-sm lg:flex">
        <div className="chatbox">
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-10 fixed flex flex-row gap-6 bottom-0 left-0 right-0 p-4">
        <input
          type="text"
          value={message}
          onChange={handleChange}
          className='w-full border border-gray-300 p-2 rounded-full bg-transparent focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent'
        />
        <button type="submit">Send</button>
      </form>
    </main>
  );
}