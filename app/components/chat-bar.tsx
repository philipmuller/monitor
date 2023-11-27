"use client";

import React, { useState, FormEvent, ChangeEvent, startTransition, useOptimistic, useCallback } from 'react';
import { useFormStatus } from 'react-dom';

export default function ChatBar({ onSubmit }: { onSubmit: (message: string) => void}) {
    const [message, setMessage] = useState<string>('');
    const { pending } = useFormStatus();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(message);
        setMessage('');
    };

    return (
        <div className="backdrop-blur-md bg-white/30 w-screen sticky bottom-0">
            <form 
                onSubmit={handleSubmit}
                className="p-10 flex flex-row gap-6 p-4"
            >
                <input
                    name="message"
                    value={message}
                    type='text'
                    onChange={handleChange}
                    className='w-full border border-gray-300 p-2 rounded-full bg-transparent focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent'
                />
                <button type="submit" aria-disabled={pending}>Send</button>
            </form>
        </div>
    );
}