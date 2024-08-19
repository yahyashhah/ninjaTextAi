import Image from "next/image";

interface EmptyProps {
  label: string;
}

export const Empty = ({ label }: EmptyProps) => {
  return (
    <div className="h-full mt-28 flex flex-col items-center justify-center">
      <div className="relative h-56 w-80 mb-2 ">
        <Image
        alt="Empty"
        fill
        src="/empty.png"
        />
      </div>
      <p className="text-black text-md text-center">{label}</p>
    </div>
  );
};