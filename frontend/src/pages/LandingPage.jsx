import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { token } = useAuth();

  return (
    <div className="relative min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-slate-50 text-slate-900 font-sans overflow-x-hidden overflow-y-auto lg:overflow-y-hidden">
      {/* Custom Keyframe Animations for Floating Micro-interactions */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(-1deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(4deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes float-coin-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(15deg); }
        }
        @keyframes float-coin-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-10deg); }
        }
        @keyframes float-coin-3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(8deg); }
        }
        .animate-float-card-1 { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-card-2 { animation: float-medium 7s ease-in-out infinite; }
        .animate-float-coin-1 { animation: float-coin-1 5s ease-in-out infinite; }
        .animate-float-coin-2 { animation: float-coin-2 4s ease-in-out infinite; }
        .animate-float-coin-3 { animation: float-coin-3 6.5s ease-in-out infinite; }
      `}</style>

      {/* Mesh Gradient Background Blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10 select-none pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-amber-200/40 blur-[100px] md:blur-[140px]" />
        <div className="absolute top-[20%] right-[-10%] w-[55%] h-[55%] rounded-full bg-blue-100/40 blur-[130px] md:blur-[170px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[45%] h-[45%] rounded-full bg-pink-100/30 blur-[100px] md:blur-[140px]" />
      </div>

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-slate-900 tracking-wider font-mono">
            CLAR<span className="text-teal-700">i</span><span className="text-slate-400">°</span>
          </span>
        </div>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8">
          {['About', 'Product', 'Pricing', 'Support'].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Action Button */}
        <div>
          {token ? (
            <Link
              to="/groups"
              className="px-5 py-2.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-[3px_3px_0px_#0f172a] hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all inline-block"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-[3px_3px_0px_#0f172a] hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all inline-block"
            >
              Sign up
            </Link>
          )}
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 lg:py-4 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-0">
        
        {/* Left Side: Title and Card Graphics */}
        <div className="lg:col-span-7 flex flex-col gap-8 lg:gap-6 lg:pr-8">
          
          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05] max-w-2xl">
            Split smarter.<br />
            Settle <span className="text-teal-700">clearer</span>.
          </h1>

          {/* Cards Graphical Area */}
          <div className="relative w-full max-w-[440px] h-[360px] mx-auto lg:mx-0 mt-6 select-none">
            
            {/* 1. Behind Card: Blue/Teal Settle Balances Card */}
            <div className="absolute top-[40px] left-[50px] w-[340px] h-[215px] bg-[#c7e5ff] rounded-2xl border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] animate-float-card-2 p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black tracking-widest text-slate-800 font-mono">
                    SHARED BALANCE
                  </span>
                  <span className="bg-emerald-200 border border-slate-900 text-[9px] font-bold px-2 py-0.5 rounded-full text-emerald-950 shadow-[1px_1px_0px_#0f172a]">
                    ACTIVE
                  </span>
                </div>
                
                {/* Balance List */}
                <div className="flex flex-col gap-2.5 mt-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                      <span>Emma ➔ Alex</span>
                    </div>
                    <span className="font-mono">$40.00</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                      <span>Liam ➔ Alex</span>
                    </div>
                    <span className="font-mono">$40.00</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black text-slate-900 border-t border-slate-800/20 pt-2 mt-1">
                    <span>Total Outstanding</span>
                    <span className="font-mono text-sm">$80.00</span>
                  </div>
                </div>
              </div>

              {/* Card Bottom */}
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-700 tracking-wider">
                  PARIS TRIP GROUP
                </span>
                <span className="text-[11px] font-black font-mono text-slate-900">
                  4579
                </span>
              </div>
            </div>

            {/* 2. Top Card: White Group Expense Receipt Card */}
            <div className="absolute top-[10px] left-[20px] w-[340px] h-[215px] bg-white rounded-2xl border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] animate-float-card-1 p-5 flex flex-col justify-between z-10">
              
              {/* Receipt Header */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-slate-400 font-mono block">
                      GROUP LEDGER
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-0.5">
                      Dinner Split 🍕
                    </h3>
                  </div>
                  {/* Styled split badge replacing Visa */}
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-slate-900 font-mono italic tracking-tight">
                      SPLIT
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-[-2px]">
                      3 WAYS
                    </span>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="border-t-2 border-dashed border-slate-200 my-2"></div>

                {/* Expense Details */}
                <div className="flex flex-col gap-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-medium">Paid by: Alex</span>
                    <span className="font-mono font-bold text-slate-900">$120.00</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Emma's Share (Owed)</span>
                    <span className="font-mono">$40.00</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Liam's Share (Owed)</span>
                    <span className="font-mono">$40.00</span>
                  </div>
                </div>
              </div>

              {/* Receipt Bottom with Barcode & Total */}
              <div className="flex justify-between items-end border-t border-slate-100 pt-2">
                {/* Decorative barcode */}
                <div className="flex gap-0.5 h-6 items-end">
                  <div className="w-[1.5px] h-5 bg-slate-400"></div>
                  <div className="w-[3px] h-6 bg-slate-400"></div>
                  <div className="w-[1px] h-4 bg-slate-400"></div>
                  <div className="w-[2px] h-5 bg-slate-400"></div>
                  <div className="w-[4px] h-6 bg-slate-400"></div>
                  <div className="w-[1px] h-4 bg-slate-400"></div>
                  <div className="w-[2px] h-5 bg-slate-400"></div>
                </div>
                
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 block tracking-wider uppercase">
                    TOTAL AMOUNT
                  </span>
                  <span className="text-lg font-black font-mono text-slate-900 leading-none">
                    $120.00
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Floating Icons / Category Coins */}
            {/* Travel Coin */}
            <div className="absolute top-[-25px] right-[100px] w-10 h-10 rounded-full bg-blue-100 border-2 border-slate-900 flex items-center justify-center text-lg shadow-[2px_2px_0px_#0f172a] animate-float-coin-1 z-20">
              ✈️
            </div>
            
            {/* Rent Coin */}
            <div className="absolute bottom-[90px] left-[-20px] w-11 h-11 rounded-full bg-violet-100 border-2 border-slate-900 flex items-center justify-center text-xl shadow-[2px_2px_0px_#0f172a] animate-float-coin-2 z-20">
              🏠
            </div>

            {/* Coffee Coin */}
            <div className="absolute bottom-[60px] right-[25px] w-10 h-10 rounded-full bg-emerald-100 border-2 border-slate-900 flex items-center justify-center text-lg shadow-[2px_2px_0px_#0f172a] animate-float-coin-3 z-20">
              ☕
            </div>

            {/* Cash Coin */}
            <div className="absolute bottom-[-15px] left-[120px] w-12 h-12 rounded-full bg-amber-100 border-2 border-slate-900 flex items-center justify-center text-2xl shadow-[2.5px_2.5px_0px_#0f172a] animate-float-coin-1 z-20">
              💵
            </div>

            {/* Grocery Coin */}
            <div className="absolute top-[85px] right-[-15px] w-9 h-9 rounded-full bg-rose-100 border-2 border-slate-900 flex items-center justify-center text-base shadow-[1.5px_1.5px_0px_#0f172a] animate-float-coin-2 z-20">
              🛒
            </div>

          </div>

        </div>

        {/* Right Side: Stats, Description and CTAs */}
        <div className="lg:col-span-5 flex flex-col gap-8 lg:gap-6">
          
          {/* Stats section */}
          <div className="relative flex items-center gap-12 sm:gap-16">
            
            {/* Stats Items */}
            <div className="flex flex-col gap-1">
              <span className="text-4xl font-black text-slate-900 tracking-tight">
                6K+
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Groups
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-4xl font-black text-slate-900 tracking-tight">
                150+
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Expenses Split
              </span>
            </div>

            {/* Playful Hand-drawn Style Arrow from Mockup */}
            <div className="absolute top-[-30px] left-[85px] hidden sm:block pointer-events-none select-none text-slate-400">
              <svg className="w-16 h-16 transform -rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 20 C 35 15, 65 35, 75 65" />
                <path d="M63 60 L75 65 L76 52" />
              </svg>
            </div>
          </div>

          {/* Slogan Label */}
          <div className="flex items-center gap-2 text-xs font-extrabold tracking-widest text-slate-800 uppercase">
            <span>GROUP HARMONY</span>
            <span className="text-slate-400">/</span>
            <span>☀️</span>
          </div>

          {/* Description Text */}
          <p className="text-slate-600 leading-relaxed text-[15px] max-w-lg">
            We provide smart splitting services to support your group adventures.
            Our website provides social tools with a wide range of features to
            help you organize your shared expenses, detect bill anomalies, and settle
            balances instantly with full transparency.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-6">
            
            {/* Try for free button */}
            {token ? (
              <Link
                to="/groups"
                className="px-8 py-3.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-base shadow-[4px_4px_0px_#0f172a] hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[4px] active:translate-y-[4px] transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                className="px-8 py-3.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-base shadow-[4px_4px_0px_#0f172a] hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[4px] active:translate-y-[4px] transition-all"
              >
                Try for free
              </Link>
            )}

            {/* How it works text link with play button */}
            <button
              onClick={() => {
                alert(
                  "SharedSplit makes tracking group expenses a breeze!\n\n1. Create a group (e.g. Vacation, Roommates)\n2. Add members to the group\n3. Log expenses as you spend (e.g. dinner, taxi, Airbnb)\n4. Automatically split and settle up with optimized payment streams!"
                );
              }}
              className="group flex items-center gap-3 font-extrabold text-slate-900 hover:text-slate-700 transition-colors py-2"
            >
              <span className="w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a] group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[1px_1px_0px_#0f172a] transition-all bg-white">
                <svg className="w-4 h-4 text-slate-900 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="text-sm">How it works</span>
            </button>

          </div>

        </div>

      </main>
    </div>
  );
}
