"use client";

import { Message } from "../model/message";
import { useCallback, useState, useEffect } from "react";
import { getMachines, createReport, getReports, getMachineTypes } from "../engine/server-actions";
import { on } from "events";
import ReportCard from "./report-card";
import Markdown from 'react-markdown';
import { ReportData } from "../model/report-data";

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
        <Markdown className="flex flex-col gap-1">{message.content}</Markdown>
      </div>
    );
  }
  
  export function AssistantBubble({message}: {message: Message}) {
    return (
      <div className="w-full flex flex-row gap-3">
        <div className="bg-blue-200 text-blue-800 h-6 w-6 flex-none rounded-full flex justify-center place-items-center">A</div>
        <Markdown className="flex flex-col gap-1">{message.content}</Markdown>
      </div>
    
    );
  }
  
  export function ToolCallVisualizer({message, onToolSubmit}: {message: Message, onToolSubmit: (reply: string, runID: string, toolCallID: string) => void}) {

    switch (message.content) {
        case 'get_machines':
            return <GetMachinesVisualizer message={message} onToolSubmit={onToolSubmit}/>;
        case 'get_reports':
            return <ReportsList message={message} onToolSubmit={onToolSubmit}/>;
        case 'get_machine_types':
            return <GetMachineTypesVisualizer message={message} onToolSubmit={onToolSubmit}/>;
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
        let machines: {name: string, type: string}[] = [];

        if (message.toolDetails?.output == undefined || message.toolDetails?.output == null) {
            let params = JSON.parse(message.toolDetails!.arguments);
            machines = await getMachines(params.type);
            onToolSubmit(JSON.stringify(machines), message.toolDetails!.runID, message.toolDetails!.toolCallID);
        } else {
            machines = JSON.parse(message.toolDetails!.output);
        }
        
        
        setMachines((prev) => [...machines]);
        
    }, []);

    useEffect(() => {
        onLoad();
    }, [onLoad]);

    return (
        <>
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
        </>
    );
  }

  function GetMachineTypesVisualizer({message, onToolSubmit}: {message: Message, onToolSubmit: (reply: string, runID: string, toolCallID: string) => void}) {
    const [machineTypes, setMachineTypes] = useState<string[]>([]);

    const onLoad = useCallback(async () => {

        console.log("GetMachineTypesVisualizer");
        let types: string[] = [];

        if (message.toolDetails?.output == undefined || message.toolDetails?.output == null) {
            types = await getMachineTypes();
            onToolSubmit(JSON.stringify(types), message.toolDetails!.runID, message.toolDetails!.toolCallID);
        } else {
            types = JSON.parse(message.toolDetails!.output);
        }
        
        
        setMachineTypes((prev) => [...types]);
        
    }, []);

    useEffect(() => {
        onLoad();
    }, [onLoad]);

    return (
        <>
            <div className="w-full flex flex-col gap-3 border rounded-2xl p-5">
                <h2 className="text-lg">Machine Types</h2>
                {machineTypes.map((type, index) => {
                    return (
                        <p key={index}>{type}</p>
                    );
                })}
            </div>
        </>
    );
  }

  function ReportVisualizer({message, onToolSubmit}: {message: Message, onToolSubmit: (reply: string, runID: string, toolCallID: string) => void}) {
    const [confirmed, setConfirmed] = useState<boolean | undefined>(undefined);

    const onLoad = useCallback(async () => {
        let output = message.toolDetails?.output;
        if (output != undefined && output != null) {
            if (output == 'confirmed') {
                console.log("Widget changed state to confirmed");
                setConfirmed((prev) => true);
            } else {
                setConfirmed((prev) => false);
            }
        }  
    }, [setConfirmed, message]);

    useEffect(() => {
        onLoad();
    }, [onLoad]);

    const submitAnswer = useCallback(async (answer: boolean) => {
        setConfirmed((prev) => answer);
        onToolSubmit(answer ? "confirmed" : "rejected", message.toolDetails!.runID, message.toolDetails!.toolCallID);

        if (answer == true) {
            const report = {
                id: "", //this won't be used in db call
                date: "", //this won't be used either
                machineName: JSON.parse(message.toolDetails!.arguments).name,
                machineType: JSON.parse(message.toolDetails!.arguments).type, 
                status: JSON.parse(message.toolDetails!.arguments).state,
                remarks: JSON.parse(message.toolDetails!.arguments).remarks
            }
    
            await createReport(report);
        }
    }, [onToolSubmit, setConfirmed, message]);

    return (
      <div className="w-full flex flex-col gap-3 place-items-center">
        <ReportCard 
        data={{
            id: "adasddmpoaskdpokad", 
            date: (new Date()).toISOString(), 
            machineName: JSON.parse(message.toolDetails!.arguments).name,
            machineType: JSON.parse(message.toolDetails!.arguments).type,
            status: JSON.parse(message.toolDetails!.arguments).state,
            remarks: JSON.parse(message.toolDetails!.arguments).remarks}}
        interactiveData={{
            confirmed: confirmed,
            submitAnswer: submitAnswer
        }}/>

        
      </div>
    );
  }


  function ReportsList({message, onToolSubmit}: {message: Message, onToolSubmit: (reply: string, runID: string, toolCallID: string) => void}) {
    const [reports, setReports] = useState<ReportData[]>([]);

    const onLoad = useCallback(async () => {
        let reports: ReportData[] = [];

        if (message.toolDetails?.output == undefined || message.toolDetails?.output == null) {
            let params = JSON.parse(message.toolDetails!.arguments);
            reports = await getReports(params);
            onToolSubmit(JSON.stringify(reports), message.toolDetails!.runID, message.toolDetails!.toolCallID);
        } else {
            reports = JSON.parse(message.toolDetails!.output);
        }
        
        
        setReports((prev) => [...reports]);
        
    }, []);

    useEffect(() => {
        onLoad();
    }, [onLoad]);

    return (
        <>
            <div className="w-full flex flex-col gap-3">
                {reports.map((report, index) => {
                    return (
                        ReportCard({data: report})
                    );
                })}
            </div>
        </>
    );
  }