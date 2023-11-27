"use server";

import { revalidatePath } from 'next/cache';
import { OpenAIEngine } from './ai-engine';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Message } from '../model/message';

export async function send(data: string, toolData?: {toolRunID: string, toolCallID: string}): Promise<{ message?: Message, threadID: string, runID: string}  | undefined> {
    console.log(`About to request answer for text: ${data}`);
    const ai = new OpenAIEngine();

    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    let response: { message?: Message, threadID: string, runID: string} | undefined = undefined;

    //are there any existing threads for this user?
    const { data: threads } = await supabase.from("threads").select().order('created_at', { ascending: false });
    console.log(`Threads: ${JSON.stringify(threads)}`);
    if ( threads != null && threads.length > 0) { // if there are, use the most recent
        const thread = threads[0];
        console.log(`About to continue convo on thread: ${JSON.stringify(thread)}`);

        if (toolData != null && toolData != undefined) { // if this is a tool response
            response = await ai.toolResponse(data, thread.id, toolData.toolRunID, toolData.toolCallID);
        } else {
            response = await ai.generateFrom(data, {threadID: thread.id});
        }
         
    } else { // if there aren't, create a new thread
        console.log(`About to start new convo on new thread`);
        response = await ai.generateFrom(data);

        //instert new thread into database
        await supabase.from("threads").insert([{id: response.threadID}]);
    }

    console.log(`AI response: ${JSON.stringify(response)}`);
    return response;
}

export async function getMachines(type?: string): Promise<{name: string, type: string}[]> {
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