"use client";

import { Message } from "../model/message";
import { useState, useRef, useEffect, use } from "react";
import ChatBar from "./chat-bar";
import { ChatBubble } from "./chat-elements";
import { send, clearConvo } from "../engine/server-actions";
import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function Chat({ initialMessages }: { initialMessages: Message[] }) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const toolCallCount = useRef(0);
    const router = useRouter();
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const messageToolCalls = useRef<{reply: string, toolData?: {runID: string, toolCallID: string}}[]>([]);
    
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    const onSubmit = useCallback(async (message: string) => {
        //startTransition(async () => {
            const newMessage = { by: 'user', type: 'text', content: message };
            setMessages((oldMsg) => [...oldMsg, newMessage]);

            startTransition(async () => {
                const response = await send([{reply: message}]);
                console.log("Response from submission: "+JSON.stringify(response));
                if (response?.messages != null && response?.messages != undefined) {
                    const newMessages = response?.messages!;
                    let toolMsgCount = 0;
                    for (let msg of newMessages) {
                        if (msg.by == "tool") {
                            toolMsgCount = toolMsgCount + 1;
                        }
                    }
                    console.log("ToolMsgCount: "+toolMsgCount+"useRefValue: "+toolCallCount.current);
                    toolCallCount.current += toolMsgCount;
                    console.log("AFTeR UpDAtE ToolMsgCount: "+toolMsgCount+"useRefValue: "+toolCallCount.current);
                    setMessages((oldMsg) => [...oldMsg, ...newMessages]);
                }
            }); 

            console.log("Tool count overview after new results! toolCallCount: "+toolCallCount.current+" messageToolCalls: "+JSON.stringify(messageToolCalls.current));
        //});
    }, []);

    const onClearConvo = useCallback(async () => {
        //startTransition(async () => {
            setMessages((oldMsg) => []);
            await clearConvo();
            router.refresh();
        //});
    }, [router]);

    const onToolSubmit = useCallback(async (reply: string, runID: string, toolCallID: string) => {
        //startTransition(async () => {
            console.log("Tool count overview TOOL SUBMIT START! toolCallCount: "+toolCallCount.current+" messageToolCalls: "+JSON.stringify(messageToolCalls.current));
            /*if total tool calls is 0 when this gets called, 
            it means that it is an unnecessary call which should be ignored.
            Tool widgets can call this method sometimes on refresh, but we don't want to interrogate the server when it happenes.
            The calls to openai to generate new messages should always be happening just once per tool call.
            */
            if (toolCallCount.current == 0) {
                return;
            }

            /*if the total tool call is 1, it means that this is the last tool call before all of them are exhausted.
            It also means that I should be gathering all the data from all the other tool calls to generate a single request*/
            if (!messageToolCalls.current.includes({reply: reply, toolData: {runID: runID, toolCallID: toolCallID}})) {
                messageToolCalls.current.push({reply: reply, toolData: {runID: runID, toolCallID: toolCallID}});

                if (toolCallCount.current == 1) {
                    startTransition(async () => {
                        const response = await send(messageToolCalls.current);
                        if (response?.messages != null && response.messages != undefined) {
                            const newMessages = response?.messages!;
                            let toolMsgCount = 0;
                            for (let msg of newMessages) {
                                if (msg.by == "tool") {
                                    toolMsgCount = toolMsgCount + 1;
                                }
                            }
                            console.log("ToolMsgCount: "+toolMsgCount+"useRefValue: "+toolCallCount.current);
                            toolCallCount.current += toolMsgCount;
                            console.log("AFTeR UpDAtE ToolMsgCount: "+toolMsgCount+"useRefValue: "+toolCallCount.current);
                            setMessages((oldMsg) => [...oldMsg, ...response.messages!]);
                        }
                    });
                    messageToolCalls.current = [];
                }
                toolCallCount.current -= 1;
            }

            console.log("Tool count overview TOOL SUBMIT END! toolCallCount: "+toolCallCount.current+" messageToolCalls: "+JSON.stringify(messageToolCalls.current));
        //});
    }, []);



    return (
        <>
            <div className="flex w-full flex-col items-center gap-5 justify-start text-sm lg:flex pl-8 pr-10 pt-20">
                {
                    messages?.map((message, index) => (
                        <ChatBubble key={index} message={message} onToolSubmit={onToolSubmit} />
                    ))
                }
                {isPending ? <p className="text-gray-400">Loading...</p> : null}
                <div className="h-48 bg-transparent"/>
                <div ref={messagesEndRef} />
            </div>

            <ChatBar onSubmit={onSubmit} onClear={onClearConvo}/>
        
        </>
    );
}