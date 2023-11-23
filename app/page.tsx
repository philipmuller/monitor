import React, { useState, FormEvent, ChangeEvent } from 'react';
import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { type } from 'os';
import { revalidateTag, revalidatePath } from 'next/cache'

type Card = {
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  avatar: string;
}

export default async function Home() {

  async function fetchReports(): Promise<Card[]> {
    const response = await kv.lrange('reportsList', 0, -1);
    let cards: Card[] = [];
    for (const report of response) {
      console.log(report);
      cards.push(JSON.parse(report));
    }

    return cards;
  }

  async function fetchMessages(): Promise<string[]> {
    const messages = await kv.lrange('messages', 0, 100);
    const test = await kv.hgetall('user:me');
    console.log("Messages: " + messages);
    console.log("User: " + JSON.stringify(test));
    return messages;
  }

  async function handleSubmit(data: FormData) {
    "use server";
    console.log(data.get('message'));
    await kv.lpush('messages', data.get('message'));
    revalidatePath('/');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    //setMessage(e.target.value);
  };

  return (
    <main className="flex min-h-screen bg-white text-slate-800 flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-end font-mono text-sm lg:flex">
        <div className="chatbox">
          {await fetchMessages().then((messages) => {
            return messages.map((message, index) => (
              <p key={index}>{message}</p>
            ))
          })
          }
        </div>
      </div>
      <form 
      action={handleSubmit} 
      className="p-10 fixed flex flex-row gap-6 bottom-0 left-0 right-0 p-4">
        <input
          name="message"
          className='w-full border border-gray-300 p-2 rounded-full bg-transparent focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent'
        />
        <button type="submit">Send</button>
      </form>
    </main>
  );
}