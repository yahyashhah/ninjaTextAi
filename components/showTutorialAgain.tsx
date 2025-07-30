"use client";
import React from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { GraduationCap } from "lucide-react"; 

interface ShowTutorialAgainProps {
  userId?: string;
  setSidebarOpen?: (open: boolean) => void;
}

const ShowTutorialAgain = ({ userId, setSidebarOpen }: ShowTutorialAgainProps) => {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  
  const handleShowTutorialAgain = async () => {
    if (!userId) return;
    
    try {
      await fetch('/api/update-user-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          metadata: { hasSeenTutorial: false }
        })
      });
      setSidebarOpen?.(false); // Close sidebar if open
      // Open sidebar if it's not already open (for mobile)
      // if (onSidebarOpen) {
      //   onSidebarOpen();
      // }
      
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
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm bg-[#5E85FE] hover:bg-[#4a6dc7] text-white rounded-lg transition-colors w-full justify-center"
          >
            <GraduationCap className="h-4 w-4" />
            Show Tutorial Again
          </button>
          
          {/* Mobile version */}
          <button
            onClick={handleShowTutorialAgain}
            className="md:hidden flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#5E85FE] hover:bg-[#4a6dc7] text-white rounded-lg transition-colors w-full"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Show Tutorial</span>
          </button>
        </>
      )}
    </div>
  );
};

export default ShowTutorialAgain;