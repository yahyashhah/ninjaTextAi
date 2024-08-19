import { Circle } from "lucide-react"
import Image from "next/image"

export const LoaderStripe = () => {
  return (
    <div className="w-full h-full flex flex-col gap-y-4 items-center justify-center">
        <div className="w-4 h-4 realtive animate-ping">
            <Circle />
        </div>
        <p className="text-sm text-muted-foreground">Please wait...</p>
    </div>
  )
}