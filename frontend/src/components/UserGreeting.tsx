import Image from "next/image";

export function UserGreeting({ nome }: { nome?: string }) {
  return (
    <header className="flex shrink-0 justify-between border-b border-black/20 bg-white p-6">
      <p className="flex items-center text-[16px] font-bold">
        <Image src="/melon.png" alt="" width={20} height={20} />
        NUTRI
      </p>
      {nome && <p className="font-normal leading-none">Olá, {nome}</p>}
    </header>
  );
}
