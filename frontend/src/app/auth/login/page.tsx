export default function login() {
  return (
        <section className="h-screen grid grid-cols-[40%_60%]">
          <div className="bg-[#ffffff] flex flex-col justify-center items-center gap-2 px-30">
            <div className="w-4 h-4 bg-[#000000]"></div>
            <h1 className="text-[32px] font-[700]">Acesso nutricionista</h1>
            <p className="text-[18px] font-[400] text-content-secondary">Dieta fácil de seguir e seja o orgulho do nutri.</p>
            <form className="flex flex-col gap-6 w-full mt-10">
              <input 
              type="text"
              placeholder="E-mail"
              className="
              border border-[#939393] rounded-[16px] p-3 text-[16px]
              hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
              focus:outline-[#000000]
              "
              />
              <input
              type="password"
              placeholder="Senha de acesso"
              className="border border-[#939393] rounded-[16px] p-3 text-[16px]
              hover:outline-[1.5] hover:outline-[#000000] cursor-pointer transition-colors
              focus:outline-[#000000]"
              />
              <button
              type="button"
              className="w-full px-12 py-3 bg-[#000000] rounded-[16px] text-white
              hover:bg-[#3d3d3d] cursor-pointer transition-colors">
                Acessar conta
              </button>
            </form>
            <button
              type="button"
              className="mt-16 w-full px-12 py-3 bg-[#F6F2EF] rounded-[16px] text-black
              hover:bg-[#e3dcd6] cursor-pointer transition-colors">
                Criar conta
              </button>
          </div>
          <div className="bg-[#C8FFEC]"></div>
        </section>
  );
}