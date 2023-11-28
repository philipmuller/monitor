"use server";

import { revalidatePath } from 'next/cache';
import { OpenAIEngine } from './ai-engine';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Message } from '../model/message';
import { ReportData } from '../model/report-data';
import { todo } from 'node:test';
import moment from 'moment';

export async function send(data: {reply: string, toolData?: {runID: string, toolCallID: string}}[]): Promise<{ messages?: Message[], threadID: string, runID: string}  | undefined> {
    if (data.length == 0) return undefined;

    console.log(`About to request answer for text: ${data[0].reply}, toolData: ${JSON.stringify(data[0].toolData)}`);
    const ai = new OpenAIEngine();

    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    let response: { message?: Message[], threadID: string, runID: string} | undefined = undefined;

    //are there any existing threads for this user?
    const { data: threads } = await supabase.from("threads").select().order('created_at', { ascending: false });
    console.log(`Threads: ${JSON.stringify(threads)}`);
    if ( threads != null && threads.length > 0) { // if there are, use the most recent
        const thread = threads[0];
        console.log(`About to continue convo on thread: ${JSON.stringify(thread)}`);

        if (data[0].toolData != null && data[0].toolData != undefined) { // if this is a tool response
            response = await ai.toolResponse(data, thread.id);
        } else {
            response = await ai.generateFrom(data[0].reply, {threadID: thread.id});
        }
         
    } else { // if there aren't, create a new thread
        console.log(`About to start new convo on new thread`);
        response = await ai.generateFrom(data[0].reply);

        //instert new thread into database
        await supabase.from("threads").insert([{id: response.threadID}]);
    }

    console.log(`AI response: ${JSON.stringify(response)}`);
    return response;
}

export async function getMachines(type?: string): Promise<{name: string, type: string}[]> {
    console.log(`Get machines called! params: ${type}`);

    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    var machines: {name: any, type: any}[] | null = null;

    if (type != null && type != undefined) {
        var { data: machines } = await supabase.from("machines").select("name, type").eq('type', type);
    } else {
        var { data: machines } = await supabase.from("machines").select("name, type");
    }

    return machines ?? [];
}

export async function getMachineTypes(): Promise<string[]> {
    console.log(`Get machine types called!`);
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    var { data: machineTypes } = await supabase.from("machine-types").select("type");

    return machineTypes?.map((element) => element.type) ?? [];
}

function convertToOriginalDate(date: Date) {
    console.log(`Converting date: ${date}`);
    var userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const originalDate = new Date(date.getTime() - userTimezoneOffset);
    console.log(`Converted date: ${originalDate}`);
    return originalDate;
}

export async function getReports(options?: {from?: string, to?: string, type?: string, name?: string, status?: string, upTo?: number}): Promise<ReportData[]> {
    console.log(`Get reports called! options: ${JSON.stringify(options)}`);
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    var dbReports: {
        id: any, 
        created_at: any, 
        machine: {name: any, type: any}, 
        status: any, 
        remarks: any
    }[] | null = null;

    if (options != null && options != undefined) {
        let query = supabase.from("reports").select("id, created_at, machine!inner (name, type), status, remarks");

        if (options.from)  {
            let fromDate = new Date(options.from!);
            fromDate = convertToOriginalDate(fromDate);
            const fromDateString = fromDate.toISOString();
            console.log(`From date string: ${fromDateString}, fromDate object: ${JSON.stringify(fromDate)}`);
            query = query.gte('created_at', options.from!)
        }
        if (options.to)  {
            let toDate = new Date(options.to!);
            toDate = convertToOriginalDate(toDate);
            const toDateString = toDate.toISOString();
            console.log(`To date string: ${toDateString}, toDate object: ${JSON.stringify(toDate)}`);
            query = query.lte('created_at', options.to!)
        }
        if (options.type) { query = query.eq('machine.type', options.type!) }
        if (options.name) { query = query.eq('machine.name', options.name!) }
        if (options.status) { query = query.eq('status', options.status!) }
        if (options.upTo) { query = query.limit(options.upTo!) }
        query = query.order('created_at', { ascending: false });

        console.log(`Final Query: ${JSON.stringify(query)}`);

        // @ts-ignore This is a huge bug in the typescript definitions for supabase. The compiler thinks an array is being returned for machines, but that is not the case
        var { data: dbReports } = await query;
    } else {
        // @ts-ignore
        var { data: dbReports } = await supabase.from("machines").select("id, created_at, machine(name, type), status, remarks");
    }

    const returnReports = dbReports?.map((dbReport) => {
        return {
            id: dbReport.id,
            date: dbReport.created_at,
            machineName: dbReport.machine.name,
            machineType: dbReport.machine.type,
            status: dbReport.status,
            remarks: dbReport.remarks
        }
    });

    console.log(`DB reports: ${JSON.stringify(dbReports)}`);
    console.log(`returnReports: ${JSON.stringify(returnReports)}`);

    return returnReports ?? [];
}

export async function clearConvo() {
    console.log(`About to clear convo`);

    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    //are there any existing threads for this user?
    const { data: threads } = await supabase.from("threads").select().order('created_at', { ascending: false });
    console.log(`Threads: ${JSON.stringify(threads)}`);
    if ( threads != null && threads.length > 0) { // if there are, use the most recent
        const thread = threads[0];
        console.log(`About to clear convo on thread: ${JSON.stringify(thread)}`);

        await supabase.from("threads").delete().eq('id', thread.id);

        const ai = new OpenAIEngine();
        await ai.deleteThread(thread.id);

        revalidatePath('/'); // revalidate the index page to clear the cache
    }
}

export async function createReport(data: ReportData) {
    console.log(`Create report called with data: ${JSON.stringify(data)}`);

    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    //Get machine ID from name
    const { data: machineIDs } = await supabase.from("machines").select("id").eq('name', data.machineName);

    if (machineIDs != null && machineIDs != undefined && machineIDs.length > 0) {
        console.log("some machines match criteria");
        const selectedMachineID = machineIDs[0].id;

        //create object to insert

        const dbReport = {
            machine: selectedMachineID,
            status: data.status,
            remarks: data.remarks,
        }

        //insert into database
        await supabase.from("reports").insert([dbReport]);
    } else {
        console.log("no machines match criteria");
    } 
}