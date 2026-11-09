import Image from "next/image";

type UserGreetingProps = {
  nome: string;
  logo?: string;
};

export function UserGreeting({ nome, logo }: UserGreetingProps) {
  return (
    <div className="
        flex justify-between p-6
        bg-[#ffffff] border-b border-black/20">
            <p className="flex items-center text-[16px] font-[700]">
                {logo && <Image src={logo} alt="" width={20} height={20} />}
                NUTRI
            </p>
            <p className="font-[400] leading-none">Olá, {nome}</p>
    </div>
  )
}