'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignUp = async () => {
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    router.refresh();
  }

  const handleSignIn = async () => {
    await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log(`attempting to push: ${location.origin}`);
    router.push(`${location.origin}`);
    router.refresh();
  }

  return (
    <main className='h-screen bg-white text-slate-800 flex flex-col gap-10 justify-center justify-items-center content-center p-10'>

        <div>
            <h2 className='text-xl'>Email</h2>
            <input 
                name="email" 
                onChange={(e) => setEmail(e.target.value)} 
                value={email} 
                className='border-2 rounded h-14 text-slate-800 p-4 w-full'
            />
        </div>

        <div>
            <h2 className='text-xl'>Password</h2>
            <input
                type="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className='border-2 rounded h-14 text-slate-800 p-4 w-full'
            />
        </div>
        
        <div className='flex flex-col gap-3'>
            <button onClick={handleSignIn} className='bg-slate-500 text-white py-2 px-4 rounded'>Sign in</button>
            <button onClick={handleSignUp} className='bg-stone-500 text-white py-2 px-4 rounded'>Sign up</button>
        </div>
        
    </main>
  )
}