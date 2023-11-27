import { OpenAIEngine } from './engine/ai-engine';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Message } from './model/message';
import Chat from './components/chat';

export const revalidate = 0;

export default async function Home() {

  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const {data: { session }} = await supabase.auth.getSession();

  if (session == null) {
    return redirect('/login');
  }

  const ai = new OpenAIEngine();

  //Get the threads associated with the user
  const { data: threads } = await supabase.from("threads").select().order('created_at', { ascending: false });

  let messages: Message[] = [];

  if ( threads != null && threads.length > 0) {
    const thread = threads[0];
    console.log(`About to request messages from: ${JSON.stringify(thread)}`);
    messages = await ai.getMessages(thread.id);
  }

  return (
    <main className="flex h-full text-slate-800 flex-col items-center justify-between">
      <Chat initialMessages={messages} />
    </main>
  );
}