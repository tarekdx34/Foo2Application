import logoImage from "../../assets/e6b60987f1bbbd45292824691c50a66ebae42bce.png";

export function Header() {
  return (
    <header className="w-full py-6 flex flex-col items-center justify-center">
      <div className="relative">
        <img 
          src={logoImage} 
          alt="فووق" 
          className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-lg"
        />
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-white mt-2 tracking-wide" 
          style={{ 
            textShadow: '3px 3px 0px #D97706, 6px 6px 0px rgba(0,0,0,0.2)',
            WebkitTextStroke: '2px #78350F'
          }}>
        فــووق
      </h1>
    </header>
  );
}
