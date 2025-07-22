"use client"
import React from 'react'
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { GraduationCap, BookOpen } from "lucide-react"; 

const ShowTutorialAgain = ({ userId }) => {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  
  const handleShowTutorialAgain = async () => {
    if (!userId) return;
    
    try {
      fetch('/api/update-user-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          metadata: { hasSeenTutorial: false }
        })
      }).catch(error => console.error("Failed to reset tutorial state:", error));
      
      router.push('/chat?tutorial=true&force=true');
    } catch (error) {
      console.error("Failed to reset tutorial state:", error);
    }
  };

   return (
    <div>
      {isSignedIn && (
        <>
          {/* Desktop version */}
          <button
            onClick={handleShowTutorialAgain}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm bg-[#5E85FE] hover:bg-[#4a6dc7] text-white rounded-lg transition-colors"
          >
            <GraduationCap className="h-4 w-4" /> {/* Changed icon */}
            Show Tutorial Again
          </button>
          
          {/* Mobile version */}
          <button
            onClick={handleShowTutorialAgain}
            className="md:hidden p-2 bg-[#5E85FE] hover:bg-[#4a6dc7] text-white rounded-lg transition-colors"
            aria-label="Show tutorial again"
          >
            <GraduationCap className="h-5 w-5" /> {/* Matching icon */}
          </button>
        </>
      )}
    </div>
  )
}

export default ShowTutorialAgain;