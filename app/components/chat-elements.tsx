"use client";

import { Message } from "../model/message";
import { useCallback, useState, useEffect } from "react";
import { getMachines } from "../engine/server-actions";
import { on } from "events";
import ReportCard from "./report-card";

export function ChatBubble({message, onToolSubmit}: {message: Message, onToolSubmit: (reply: string, runID: string, toolCallID: string) => void}) {
    if (message.by == 'user') {
      return <UserBubble message={message}/>;
    } else if (message.by == 'assistant') {
      return <AssistantBubble message={message}/>;
    } else {
      return <ToolCallVisualizer message={message} onToolSubmit={onToolSubmit}/>;
    }
  }
  
  export function UserBubble({message}: {message: Message}) {
    return (
      <div className="w-full flex flex-row gap-3">
        <div className="bg-green-200 text-green-800 h-6 w-6 flex-none rounded-full flex justify-center place-items-center">U</div>
        <p>{message.content}</p>
      </div>
    );
  }
  
  export function AssistantBubble({message}: {message: Message}) {
    return (
      <div className="w-full flex flex-row gap-3">
        <div className="bg-blue-200 text-blue-800 h-6 w-6 flex-none rounded-full flex justify-center place-items-center">A</div>
        <p>{message.content}</p>
      </div>
    
    );
  }
  
  export function ToolCallVisualizer({message, onToolSubmit}: {message: Message, onToolSubmit: (reply: string, runID: string, toolCallID: string) => void}) {

    switch (message.content) {
        case 'get_machines':
            return <GetMachinesVisualizer message={message} onToolSubmit={onToolSubmit}/>;
        case 'create_report':
            return <ReportVisualizer message={message} onToolSubmit={onToolSubmit}/>;
        default:
            break;
    }
  
    return (
      <div className="w-full flex flex-col gap-3">
        <p>{message.content}</p>
        <p>{message.toolDetails?.arguments}</p>
        <p>{message.toolDetails?.output}</p>
      </div>
    );
  
  }

  function GetMachinesVisualizer({message, onToolSubmit}: {message: Message, onToolSubmit: (reply: string, runID: string, toolCallID: string) => void}) {
    const [machines, setMachines] = useState<{name: string, type: string}[]>([]);

    const onLoad = useCallback(async () => {
        let params = JSON.parse(message.toolDetails!.arguments);
        let machines = await getMachines(params.type);
        
        setMachines((prev) => [...machines]);
        onToolSubmit(JSON.stringify(machines), message.toolDetails!.runID, message.toolDetails!.toolCallID);
    }, []);

    useEffect(() => {
        onLoad();
    }, [onLoad]);

    return (
      <div className="w-full grid grid-cols-2 gap-3 border rounded-2xl p-5">
        <h2 className="text-lg">Name</h2>
        <h2 className="text-lg">Type</h2>
        {machines.map((machine, index) => {
            return (
                <>
                    <p>{machine.name}</p>
                    <p>{machine.type}</p>
                </>
            );
        })}
      </div>
    );
  }

  function ReportVisualizer({message, onToolSubmit}: {message: Message, onToolSubmit: (reply: string, runID: string, toolCallID: string) => void}) {
    const [confirmed, setConfirmed] = useState<boolean>(false);

    return (
      <div className="w-full flex flex-col gap-3">
        <h2>Report</h2>
        <ReportCard data={{
            id: "adasddmpoaskdpokad", 
            date: new Date(), 
            machineName: JSON.parse(message.toolDetails!.arguments).name, 
            status: JSON.parse(message.toolDetails!.arguments).state,
            remarks: JSON.parse(message.toolDetails!.arguments).remarks}} />
      </div>
    );
  }