'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [showEmailSent, setShowEmailSent] = useState(false);

  const handleSignUp = async () => {
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    
    setShowEmailSent(true);
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

  const confirmationNotification = () => {
    return (
      <div className='w-full bg-sky-100 rounded p-5'>
            <h2 className='font-semibold text-sky-700'>Check your inbox!</h2>
            <p className='text-sky-700'>A confirmation email has been sent to your inbox. Please follow the link to complete your registration.</p>
      </div>
    );
  }

  const signinForm = () => {
    return (
      <>
      <div className='flex flex-col gap-5'>
          <div>
              <h2 className='text-lg text-slate-500'>Email</h2>
              <input 
                  name="email" 
                  onChange={(e) => setEmail(e.target.value)} 
                  value={email} 
                  className='border-2 rounded h-14 text-slate-800 p-4 w-full'
              />
          </div>

          <div>
              <h2 className='text-lg text-slate-500'>Password</h2>
              <input
                  type="password"
                  name="password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  className='border-2 rounded h-14 text-slate-800 p-4 w-full'
              />
          </div>
        </div>
        
        <div className='flex flex-col gap-3'>
            <button onClick={handleSignIn} className='bg-sky-500 text-white py-2 px-4 rounded'>Sign in</button>
            <button onClick={handleSignUp} className='bg-sky-300 text-white py-2 px-4 rounded'>Sign up</button>
        </div>
      
      </>
    );
  }

  return (
    <main className='bg-white text-slate-800 flex flex-col gap-10 p-14 pt-32'>

        <div className='flex flex-col gap-3'>
            <h2 className='text-2xl font-semibold text-sky-700'>Welcome to Pulseflow!</h2>
            <p className='text-slate-600'>Pulseflow lets engineers and technicians monitor factory equipment and machines. Please sign in or create a new account below.</p>
        </div>

        {showEmailSent ? confirmationNotification() : signinForm()}
        
    </main>
  )
}