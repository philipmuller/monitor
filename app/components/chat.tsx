"use client";

import { Message } from "../model/message";
import { useState } from "react";
import ChatBar from "./chat-bar";
import { ChatBubble } from "./chat-elements";
import { send } from "../engine/server-actions";
import { useCallback } from "react";

export default function Chat({ initialMessages }: { initialMessages: Message[] }) {

    const [messages, setMessages] = useState<Message[]>(initialMessages);

    const onSubmit = useCallback(async (message: string) => {
        const newMessage = { by: 'user', type: 'text', content: message };
        setMessages((oldMsg) => [...oldMsg, newMessage]);

        const response = await send(message);
        if (response?.message != null && response.message != undefined) {
            setMessages((oldMsg) => [...oldMsg, response.message!]);
        }

    }, []);

    const onToolSubmit = useCallback(async (reply: string, runID: string, toolCallID: string) => {

        const response = await send(reply, { toolRunID: runID, toolCallID: toolCallID});
        if (response?.message != null && response.message != undefined) {
            setMessages((oldMsg) => [...oldMsg, response.message!]);
        }

    }, []);



    return (
        <>
            <div className="flex w-full flex-col items-center gap-5 justify-end text-sm lg:flex pl-8 pr-10 pt-20">
                {
                    messages?.map((message, index) => (
                        <ChatBubble key={index} message={message} onToolSubmit={onToolSubmit} />
                    ))
                }
            </div>

            <ChatBar onSubmit={onSubmit}/>
        
        </>
    );
}