export default function home() {
  return (
    <section className="flex flex-col gap-10">
        <div className="
        flex justify-between p-6
        border-b border-black/20">
            <p className="text-[16px] font-[700]">NUTRI</p>
            <p clasName="font-[400] leading-none">Olá, UserName</p>
        </div>
        <div className="p-6">
            <p className="text-[16px] text-[32px] font-[600]">Meus pacientes</p>
        </div>
    </section>
  );
}
