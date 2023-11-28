"use client";

import React, { useState, FormEvent, ChangeEvent, startTransition, useOptimistic, useCallback, MouseEventHandler } from 'react';
import { useFormStatus } from 'react-dom';

export default function ChatBar({ onSubmit, onClear, disabled }: { onSubmit: (message: string) => void, onClear: () => void, disabled: boolean }) {
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

    const handleClear = (e: any) => {
        onClear();
    };

    return (
        <div className="backdrop-blur-md bg-white/30 w-screen fixed bottom-0 pb-5">
            <form 
                onSubmit={handleSubmit}
                className="p-10 flex flex-col gap-5 p-4"
            >
                <div className='flex flex-row gap-4'>
                    <input
                        name="message"
                        value={message}
                        type='text'
                        onChange={handleChange}
                        disabled = {disabled}
                        className={`w-full border ${disabled ? "bg-gray-100" : ""} border-gray-300 p-2 rounded-full bg-transparent focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent`}
                    />
                    { (!disabled)
                    ? <button type="submit" aria-disabled={pending}>Send</button>
                    : <div className='flex items-center'><span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-300"></span>
                      </span></div>
                    }
                </div>

                
                <button type='button' className='text-red-400' onClick={handleClear}>Clear conversation</button>
            </form>
        </div>
    );
}