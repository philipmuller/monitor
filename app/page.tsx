import React, { useState, FormEvent, ChangeEvent } from 'react';
import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { type } from 'os';
import { revalidateTag, revalidatePath } from 'next/cache';
import { ReportData } from './model/report-data';
import ReportCard from './components/report-card';
import { sql } from "@vercel/postgres";
import supabase from './utils/supabase';

export const revalidate = 30;

export default async function Home() {

  const { data } = await supabase.from("reports").select("*, machine(name, type)");
  console.log(JSON.stringify(data));

  async function handleSubmit(data: FormData) {
    "use server";
    console.log(data.get('message'));
    await kv.lpush('messages', data.get('message'));
    revalidatePath('/');
  };

  return (
    <main className="flex min-h-screen bg-white text-slate-800 flex-col items-center justify-between p-10">
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