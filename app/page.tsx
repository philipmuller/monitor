import React, { useState, FormEvent, ChangeEvent } from 'react';
import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { type } from 'os';
import { revalidateTag, revalidatePath } from 'next/cache';
import { ReportData } from './model/report-data';
import ReportCard from './components/report-card';
import { sql } from "@vercel/postgres";
import supabase from './utils/supabase';
import { OpenAIEngine } from './engine/ai-engine';
import ChatModal from './components/chat-modal';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const revalidate = 30;

export default async function Home() {

  const cookieStore = cookies();
  const sup = createServerComponentClient({ cookies: () => cookieStore });
  const { data } = await sup.from("reports").select("*, machine(name, type)");
  console.log(JSON.stringify(data));

  async function requestAnswer(text: string): Promise<string> {
    "use server";
    const ai = new OpenAIEngine();
    const response = await ai.generateFrom(text);
    revalidatePath('/');

    return response;
  }

  async function handleSubmit(data: FormData) {
    "use server";
    const text: string = data.get('message') as string || "";
    console.log(text);
    const ai = new OpenAIEngine();
    await ai.generateFrom(text);
    revalidatePath('/');
  };

  return (
    <main className="flex min-h-screen bg-white text-slate-800 flex-col items-center justify-between p-10 pt-20">
      <div className="flex w-full flex-col items-center gap-5 justify-end text-sm lg:flex">
        {
          data?.map((report) => (
            <ReportCard 
            key={report.id}
            id={report.id} 
            date={new Date(report.created_at)} 
            machineName={report.machine.name}
            status={report.status}
            remarks={report.remarks}/>
          ))
        }
      </div>
      <ChatModal convo={[]} request={requestAnswer}/>
    </main>
  );
}