import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'

const LandingNavbar = () => {
  return (
    <div className='flex items-center justify-between p-2'>
      <div className='flex'>
        <h1 className='text-xl font-bold'>CopNarrative</h1>
      </div>
      <div className='flex gap-x-12'>
        <Link className='text-md' href={"/"}>Home</Link>
        <Link href={"/"}>Pricing</Link>
        <Link href={"/"}>FAQ's</Link>
        <Link href={"/"}>Term & Condition</Link>
      </div>
      <div className='flex gap-x-2'>
        <Button className='bg-white border-2 border-black text-black hover:text-white'>Sign in</Button>
        <Button>Sign up</Button>
      </div>
    </div>
  )
}

export default LandingNavbar
