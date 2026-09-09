type UserGreetingProps = {
  nome: string;
};

export function UserGreeting({ nome }: UserGreetingProps) {
  return (
    <div className="
        flex justify-between p-6
        bg-[#ffffff] border-b border-black/20">
            <p className="text-[16px] font-[700]">NUTRI</p>
            <p className="font-[400] leading-none">Olá, {nome}</p>
    </div>
  )
}