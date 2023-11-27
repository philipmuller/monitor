"use client"

import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function LoginLogoutButton({ login }: { login: boolean }) {

    const supabase = createClientComponentClient();
    const router = useRouter();

    async function loginOrLogout() {
        if (login == true) {
            return <Link href={{pathname: "/login"}} className="bg-stone-500 text-white py-1 px-4 rounded">Log In</Link>;
        }

        return <button onClick={handleSignOut} className="bg-red-400 text-white py-1 px-4 rounded">Sign out</button>
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        console.log(`attempting to push: ${location.origin}`);
        router.push('/login');
        router.refresh();
    }

    return (
        <>
        {loginOrLogout()}
        </>
    )
  
}