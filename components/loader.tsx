import Image from "next/image"

export const Loader = () => {
  return (
    <div className="h-full flex flex-col gap-y-4 items-center justify-center">
        <div className="w-24 h-44 realtive animate-bounce duration-1000">
            <Image
            alt="Logo"
            fill
            src="/loader.png"
            />
        </div>
        <p className="text-sm text-muted-foreground">Creating the Report ...</p>
    </div>
  )
}