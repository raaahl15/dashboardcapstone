import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, ShieldCheck, LogIn, ChevronDown } from 'lucide-react';

export const LoginGateway: React.FC = () => {
  const { login, users, authError, firebaseConfigured, isLoading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Email atau password tidak sesuai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (userIdentifier: string) => {
    setEmail(userIdentifier);
    setErrorMsg(null);
  };

  return (
    <div className="bg-sexy-blue text-[#0B1B33] min-h-screen selection:bg-[#0062CC] selection:text-white relative overflow-x-hidden">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 px-6 sm:px-8 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white rounded-full shadow-xs border border-white/80">
            <span className="w-2.5 h-2.5 rounded-full bg-[#007BFF] animate-pulse"></span>
            <span className="font-heading text-xs font-bold text-[#0B1B33] tracking-tight">
              Area 1-DME
            </span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-4">
          <a
            href="#login-anchor"
            className="text-xs text-[#4A5A72] font-semibold hover:text-[#0B1B33] hover:underline transition-colors hidden sm:inline"
          >
            Langsung ke form login
          </a>
          <a
            href="#login-anchor"
            className="inline-flex items-center justify-center px-6 h-10 bg-[#0062CC] text-white rounded-full font-heading text-xs font-bold hover:bg-[#0057B8] active:scale-95 transition-all shadow-xs"
          >
            Masuk
          </a>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO / FIRST SCREEN: 1440x900 Gateway & ISA-5.1 Line Art Background */}
      {/* ========================================================================= */}
      <section
        id="login-anchor"
        className="relative w-full min-h-screen flex flex-col items-center justify-center bg-sexy-blue bg-tech-grid overflow-hidden px-4 pt-20 pb-16"
      >
        {/* Concentric Technical Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[420px] h-[420px] rounded-full border border-white/25"></div>
          <div className="absolute w-[680px] h-[680px] rounded-full border border-white/20"></div>
          <div className="absolute w-[980px] h-[980px] rounded-full border border-white/15"></div>
          <div className="absolute w-[1280px] h-[1280px] rounded-full border border-white/10"></div>
        </div>

        {/* Decorative 2px Stroke Simplified P&ID Compliant Vector Art (ISA-5.1 / ISO 10628) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none stroke-white/45 hidden md:block"
          fill="none"
          viewBox="0 0 1440 900"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g strokeWidth="2">
            {/* Feed In line */}
            <path d="M 80 450 L 220 450"></path>
            <polygon fill="rgba(255,255,255,0.4)" points="160,446 172,450 160,454"></polygon>
            {/* Field instrument bubble TI-103 */}
            <circle cx="150" cy="380" r="22" stroke="currentColor"></circle>
            <line strokeDasharray="3 3" x1="150" x2="150" y1="402" y2="450"></line>
            <text fill="white" fontFamily="Inter" fontSize="10" fontWeight="600" opacity="0.7" textAnchor="middle" x="150" y="384">
              TI-103
            </text>
            {/* Bowtie Gate Valve */}
            <polygon fill="rgba(255,255,255,0.2)" points="220,442 245,458 245,442 220,458" stroke="currentColor"></polygon>
            <line x1="232.5" x2="232.5" y1="450" y2="435"></line>
            <line x1="225" x2="240" y1="435" y2="435"></line>
            {/* Vertical process branch */}
            <path d="M 245 450 L 320 450 L 320 300 L 380 300"></path>
            <polygon fill="rgba(255,255,255,0.4)" points="320,360 324,350 316,350"></polygon>
            {/* Field Instrument TT-102 */}
            <circle cx="320" cy="230" r="22" stroke="currentColor"></circle>
            <line strokeDasharray="3 3" x1="320" x2="320" y1="252" y2="300"></line>
            <text fill="white" fontFamily="Inter" fontSize="10" fontWeight="600" opacity="0.7" textAnchor="middle" x="320" y="234">
              TT-102
            </text>
            {/* Reactor Vessel Silhouette outline on right flank */}
            <rect fill="none" height="260" rx="35" stroke="currentColor" strokeWidth="2" width="110" x="1100" y="280"></rect>
            <path d="M 1100 330 L 1210 330 M 1100 490 L 1210 490" strokeDasharray="4 4"></path>
            <text fill="white" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="700" opacity="0.6" textAnchor="middle" x="1155" y="415">
              R-01
            </text>
            <text fill="white" fontFamily="Inter" fontSize="9" opacity="0.5" textAnchor="middle" x="1155" y="432">
              DME REACTOR
            </text>
            {/* Process lines to reactor */}
            <path d="M 1030 410 L 1100 410"></path>
            <polygon fill="rgba(255,255,255,0.4)" points="1070,406 1082,410 1070,414"></polygon>
            {/* Panel Mounted Instrument TIC-101 */}
            <g transform="translate(1030, 270)">
              <circle cx="0" cy="0" r="24" stroke="currentColor"></circle>
              <line stroke="currentColor" x1="-24" x2="24" y1="0" y2="0"></line>
              <text fill="white" fontFamily="Inter" fontSize="9" fontWeight="700" opacity="0.8" textAnchor="middle" x="0" y="-5">
                TIC
              </text>
              <text fill="white" fontFamily="Inter" fontSize="9" fontWeight="700" opacity="0.8" textAnchor="middle" x="0" y="14">
                101
              </text>
              <line strokeDasharray="3 3" x1="0" x2="0" y1="24" y2="140"></line>
            </g>
            {/* Panel Mounted Instrument FIC-104 */}
            <g transform="translate(1260, 360)">
              <circle cx="0" cy="0" r="24" stroke="currentColor"></circle>
              <line stroke="currentColor" x1="-24" x2="24" y1="0" y2="0"></line>
              <text fill="white" fontFamily="Inter" fontSize="9" fontWeight="700" opacity="0.8" textAnchor="middle" x="0" y="-5">
                FIC
              </text>
              <text fill="white" fontFamily="Inter" fontSize="9" fontWeight="700" opacity="0.8" textAnchor="middle" x="0" y="14">
                104
              </text>
              <line strokeDasharray="3 3" x1="-24" x2="-50" y1="0" y2="0"></line>
            </g>
            {/* Field Instrument PI-102 */}
            <g transform="translate(1155, 180)">
              <circle cx="0" cy="0" r="22" stroke="currentColor"></circle>
              <line strokeDasharray="3 3" x1="0" x2="0" y1="22" y2="100"></line>
              <text fill="white" fontFamily="Inter" fontSize="10" fontWeight="600" opacity="0.7" textAnchor="middle" x="0" y="4">
                PI-102
              </text>
            </g>
          </g>
        </svg>

        {/* CENTERED SOLID WHITE LOGIN CARD */}
        <div className="relative z-10 w-[420px] max-w-[94vw] bg-white/[0.98] rounded-[28px] p-7 sm:p-8 shadow-cockpit-pop border border-white">
          {/* Top Pill Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAF6FD] text-[#0062CC] rounded-full font-heading text-[11px] font-bold tracking-wide">
              Area 1-DME
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div className="mb-5">
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#0B1B33] tracking-tight">
              Masuk ke Dashboard Area 1
            </h2>
            <p className="text-xs text-[#4A5A72] mt-1">
              Khusus anggota tim Area 1 dan dosen pembimbing.
            </p>
          </div>

          {/* Team account shortcuts */}
          <div className="mb-4 p-2.5 rounded-2xl bg-[#EAF6FD]/70 border border-[#C9DCEB]/50">
            <p className="text-[10px] font-bold text-[#4A5A72] uppercase tracking-wider mb-1.5">
              Pilih akun anggota tim:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.email)}
                  className="px-2.5 py-1 bg-white hover:bg-[#0B1B33] hover:text-white rounded-full text-[11px] font-semibold text-[#0B1B33] border border-white shadow-xs transition-colors"
                  title={`${u.name} (${u.title})`}
                >
                  {u.nickname} ({u.code})
                </button>
              ))}
            </div>
          </div>

          {/* Form Elements */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0B1B33] mb-1" htmlFor="email">
                Email / Username
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl border-[1.5px] border-[#6B7F99] bg-white text-[#0B1B33] placeholder:text-[#5F6F86] focus:border-[#0062CC] focus:ring-1 focus:ring-[#0062CC] text-xs transition-all outline-none"
                placeholder="lead.engineer@dme-area1.epc"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1B33] mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-11 rounded-2xl border-[1.5px] border-[#6B7F99] bg-white text-[#0B1B33] placeholder:text-[#5F6F86] focus:border-[#0062CC] focus:ring-1 focus:ring-[#0062CC] text-xs transition-all outline-none"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4A5A72] hover:text-[#0B1B33] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Compliance Note Card */}
            <div className="p-3 bg-[#EAF6FD] rounded-2xl flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#0062CC] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#0B1B33] leading-snug">
                Dirancang patuh <strong>NAMUR NA 35</strong> untuk fase rekayasa dan gerbang evaluasi FEED.
              </p>
            </div>

            {/* Primary Pill Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading || !firebaseConfigured}
              className="w-full h-12 bg-[#0062CC] text-white rounded-full font-heading text-sm font-bold hover:bg-[#0057B8] active:scale-[0.99] transition-all shadow-xs flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Memverifikasi...' : 'Masuk'}
            </button>

            {(errorMsg || authError || !firebaseConfigured) && (
              <div className="p-2.5 bg-[#FEE2E2] border border-[#B91C1C]/20 rounded-xl text-center text-xs font-semibold text-[#991B1B]">
                {errorMsg || authError}
              </div>
            )}
          </form>
        </div>

        {/* Scroll Indicator */}
        <a
          href="#scene-1"
          className="mt-8 flex flex-col items-center gap-2 group cursor-pointer z-10 transition-transform hover:translate-y-0.5"
        >
          <div className="px-4 py-1.5 bg-white rounded-full shadow-xs border border-white/80 flex items-center gap-2">
            <span className="text-xs text-[#4A5A72] group-hover:text-[#0B1B33] transition-colors font-medium">
              Scroll untuk melihat lebih lanjut
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#4A5A72] group-hover:text-[#0B1B33] animate-bounce" />
          </div>
        </a>
      </section>

      {/* ========================================================================= */}
      {/* SCENE 1: SATU SUMBER DATA AREA 1 (1440x900) */}
      {/* ========================================================================= */}
      <section
        id="scene-1"
        className="relative w-full min-h-screen flex flex-col items-center justify-center bg-sexy-blue bg-tech-grid overflow-hidden px-4 sm:px-6 py-20"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[520px] h-[520px] rounded-full border border-white/20"></div>
          <div className="absolute w-[840px] h-[840px] rounded-full border border-white/15"></div>
          <div className="absolute w-[1200px] h-[1200px] rounded-full border border-white/10"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-[1000px] w-full text-center">
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#0B1B33] tracking-tight mb-6">
            Satu sumber data Area 1
          </h2>

          {/* Centered Technical Illustration (PFD per ISO 10628) */}
          <div className="w-full max-w-[820px] bg-white/[0.3] backdrop-blur-md rounded-[24px] border border-white/60 p-4 sm:p-6 mb-6 shadow-sm overflow-x-auto">
            <svg
              className="w-full h-auto min-w-[650px] stroke-[#0B1B33]"
              fill="none"
              viewBox="0 0 780 280"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                {/* Feed Stream Node S-01 */}
                <path d="M 40 140 L 140 140" stroke="#0B1B33"></path>
                <polygon fill="#0B1B33" points="100,136 112,140 100,144" stroke="none"></polygon>
                <rect fill="white" height="20" rx="4" stroke="#0B1B33" strokeWidth="1.5" width="46" x="40" y="110"></rect>
                <text fill="#0B1B33" fontFamily="Inter" fontSize="10" fontWeight="700" textAnchor="middle" x="63" y="124">
                  S-01
                </text>
                <text fill="#0B1B33" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="middle" x="90" y="160">
                  Feed Inlet
                </text>

                {/* Preheater E-01 */}
                <circle cx="180" cy="140" fill="white" r="38" stroke="#0B1B33" strokeWidth="2"></circle>
                <path d="M 152 140 L 208 140" stroke="#0B1B33" strokeWidth="2"></path>
                <path d="M 160 120 C 170 120, 170 160, 180 160 C 190 160, 190 120, 200 120" fill="none" stroke="#0062CC" strokeWidth="2"></path>
                <text fill="#0B1B33" fontFamily="Plus Jakarta Sans" fontSize="12" fontWeight="700" textAnchor="middle" x="180" y="92">
                  E-01
                </text>
                <text fill="#4A5A72" fontFamily="Inter" fontSize="11" textAnchor="middle" x="180" y="196">
                  Preheater
                </text>

                {/* Line from E-01 to R-01 */}
                <path d="M 218 140 L 330 140" stroke="#0B1B33"></path>
                <polygon fill="#0B1B33" points="275,136 287,140 275,144" stroke="none"></polygon>
                <rect fill="white" height="20" rx="4" stroke="#0B1B33" strokeWidth="1.5" width="46" x="250" y="110"></rect>
                <text fill="#0B1B33" fontFamily="Inter" fontSize="10" fontWeight="700" textAnchor="middle" x="273" y="124">
                  S-02
                </text>

                {/* Fixed-Bed Reactor R-01 */}
                <rect fill="white" height="160" rx="28" stroke="#0B1B33" strokeWidth="2" width="90" x="330" y="60"></rect>
                <rect fill="#EAF6FD" height="70" stroke="#6B7F99" strokeDasharray="3 3" width="78" x="336" y="105"></rect>
                <line stroke="#4CBAF5" strokeWidth="1.5" x1="344" x2="406" y1="120" y2="120"></line>
                <line stroke="#4CBAF5" strokeWidth="1.5" x1="344" x2="406" y1="140" y2="140"></line>
                <line stroke="#4CBAF5" strokeWidth="1.5" x1="344" x2="406" y1="160" y2="160"></line>
                <text fill="#0B1B33" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="700" textAnchor="middle" x="375" y="45">
                  R-01
                </text>
                <text fill="#4A5A72" fontFamily="Inter" fontSize="11" textAnchor="middle" x="375" y="238">
                  Fixed-Bed Reactor
                </text>

                {/* Instrument TIC-101 */}
                <circle cx="375" cy="25" fill="white" r="22" stroke="#0B1B33"></circle>
                <line stroke="#0B1B33" strokeWidth="1.5" x1="353" x2="397" y1="25" y2="25"></line>
                <text fill="#0B1B33" fontFamily="Inter" fontSize="9" fontWeight="700" textAnchor="middle" x="375" y="20">
                  TIC
                </text>
                <text fill="#0B1B33" fontFamily="Inter" fontSize="9" fontWeight="700" textAnchor="middle" x="375" y="38">
                  101
                </text>
                <line stroke="#0B1B33" strokeDasharray="2 2" strokeWidth="1.5" x1="375" x2="375" y1="47" y2="60"></line>

                {/* Effluent Line to Flash Separator */}
                <path d="M 420 140 L 530 140" stroke="#0B1B33"></path>
                <polygon fill="#0B1B33" points="475,136 487,140 475,144" stroke="none"></polygon>
                <rect fill="white" height="20" rx="4" stroke="#0B1B33" strokeWidth="1.5" width="46" x="450" y="110"></rect>
                <text fill="#0B1B33" fontFamily="Inter" fontSize="10" fontWeight="700" textAnchor="middle" x="473" y="124">
                  S-03
                </text>

                {/* Flash Separator V-01 */}
                <rect fill="white" height="120" rx="24" stroke="#0B1B33" strokeWidth="2" width="75" x="530" y="80"></rect>
                <text fill="#0B1B33" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="700" textAnchor="middle" x="567" y="65">
                  V-01
                </text>
                <text fill="#4A5A72" fontFamily="Inter" fontSize="11" textAnchor="middle" x="567" y="218">
                  Separator
                </text>

                {/* Vapour Out */}
                <path d="M 567.5 80 L 567.5 45 L 680 45" stroke="#0B1B33"></path>
                <polygon fill="#0B1B33" points="630,41 642,45 630,49" stroke="none"></polygon>
                <text fill="#4A5A72" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="middle" x="715" y="49">
                  Vapor Out
                </text>

                {/* Bottoms Out */}
                <path d="M 567.5 200 L 567.5 235 L 680 235" stroke="#0B1B33"></path>
                <polygon fill="#0B1B33" points="630,231 642,235 630,239" stroke="none"></polygon>
                <text fill="#4A5A72" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="middle" x="720" y="239">
                  Liquid Out
                </text>
              </g>
            </svg>
          </div>

          <div className="bg-white rounded-[20px] px-6 sm:px-8 py-3.5 shadow-cockpit-pop border border-white">
            <p className="text-xs sm:text-sm text-[#0B1B33] font-semibold">
              Satu tempat untuk bimbingan, tindakan korektif, dan logbook.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SCENE 2: ANTARMUKA S-07 KE AREA 2 */}
      {/* ========================================================================= */}
      <section
        id="scene-2"
        className="relative w-full min-h-screen flex flex-col items-center justify-center bg-sexy-blue bg-tech-grid overflow-hidden px-4 sm:px-6 py-20"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[580px] h-[580px] rounded-full border border-white/20"></div>
          <div className="absolute w-[920px] h-[920px] rounded-full border border-white/15"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-[1000px] w-full text-center">
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#0B1B33] tracking-tight mb-6">
            Antarmuka S-07 ke Area 2
          </h2>

          <div className="w-full max-w-[820px] bg-white/[0.3] backdrop-blur-md rounded-[24px] border border-white/60 p-4 sm:p-6 mb-6 shadow-sm overflow-x-auto">
            <svg
              className="w-full h-auto min-w-[650px] stroke-[#0B1B33]"
              fill="none"
              viewBox="0 0 780 280"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                {/* Battery Limit Boundary Line */}
                <line stroke="#004B9F" strokeDasharray="10 4 2 4" strokeWidth="2.5" x1="390" x2="390" y1="20" y2="260"></line>
                <g transform="translate(390, 36)">
                  <rect fill="#0B1B33" height="28" rx="14" stroke="none" width="140" x="-70" y="-14"></rect>
                  <text fill="white" fontFamily="Inter" fontSize="10" fontWeight="700" letterSpacing="0.08em" textAnchor="middle" x="0" y="4">
                    BATTERY LIMIT
                  </text>
                </g>

                {/* Area 1 Reactor */}
                <g transform="translate(140, 140)">
                  <rect fill="white" height="150" rx="30" stroke="#0B1B33" strokeWidth="2" width="110" x="-55" y="-75"></rect>
                  <text fill="#0B1B33" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="700" textAnchor="middle" x="0" y="-85">
                    Area 1
                  </text>
                  <text fill="#0B1B33" fontFamily="Plus Jakarta Sans" fontSize="14" fontWeight="800" textAnchor="middle" x="0" y="5">
                    R-01
                  </text>
                  <text fill="#4A5A72" fontFamily="Inter" fontSize="10" textAnchor="middle" x="0" y="24">
                    Reactor Vessel
                  </text>
                </g>

                {/* Area 2 Distillation Column */}
                <g transform="translate(640, 140)">
                  <rect fill="white" height="210" rx="26" stroke="#0B1B33" strokeWidth="2" width="90" x="-45" y="-105"></rect>
                  <line stroke="#6B7F99" strokeDasharray="2 2" x1="-30" x2="30" y1="-50" y2="-50"></line>
                  <line stroke="#6B7F99" strokeDasharray="2 2" x1="-30" x2="30" y1="-10" y2="-10"></line>
                  <line stroke="#6B7F99" strokeDasharray="2 2" x1="-30" x2="30" y1="30" y2="30"></line>
                  <line stroke="#6B7F99" strokeDasharray="2 2" x1="-30" x2="30" y1="70" y2="70"></line>
                  <text fill="#0B1B33" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="700" textAnchor="middle" x="0" y="-115">
                    Area 2
                  </text>
                  <text fill="#0B1B33" fontFamily="Plus Jakarta Sans" fontSize="14" fontWeight="800" textAnchor="middle" x="0" y="5">
                    C-01
                  </text>
                  <text fill="#4A5A72" fontFamily="Inter" fontSize="10" textAnchor="middle" x="0" y="24">
                    Distillation Column
                  </text>
                </g>

                {/* Connection Line */}
                <path d="M 195 140 L 595 140" stroke="#0B1B33" strokeWidth="2.5"></path>
                <polygon fill="#0B1B33" points="460,135 474,140 460,145" stroke="none"></polygon>

                {/* Stream Tag Flag S-07 */}
                <g transform="translate(305, 140)">
                  <polygon fill="white" points="0,0 20,-16 70,-16 70,16 20,16" stroke="#0062CC" strokeWidth="2"></polygon>
                  <text fill="#0062CC" fontFamily="Inter" fontSize="12" fontWeight="800" textAnchor="middle" x="44" y="4">
                    S-07
                  </text>
                </g>

                {/* Process parameters tag */}
                <g transform="translate(480, 140)">
                  <rect fill="white" height="22" rx="6" stroke="#6B7F99" strokeWidth="1.2" width="115" x="-10" y="-30"></rect>
                  <text fill="#0B1B33" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle" x="47" y="-15">
                    240°C · 15.2 bar
                  </text>
                </g>
              </g>
            </svg>
          </div>

          <div className="bg-white rounded-[20px] px-6 sm:px-8 py-3.5 shadow-cockpit-pop border border-white">
            <p className="text-xs sm:text-sm text-[#0B1B33] font-semibold">
              Penyelarasan suhu, tekanan, laju alir, dan fraksi massa efluen.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SCENE 3: KEPATUHAN NAMUR NA 35 */}
      {/* ========================================================================= */}
      <section
        id="scene-3"
        className="relative w-full min-h-screen flex flex-col items-center justify-center bg-sexy-blue bg-tech-grid overflow-hidden px-4 sm:px-6 py-20"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[520px] h-[520px] rounded-full border border-white/20"></div>
          <div className="absolute w-[860px] h-[860px] rounded-full border border-white/15"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-[1000px] w-full text-center">
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#0B1B33] tracking-tight mb-6">
            Kepatuhan NAMUR NA 35
          </h2>

          <div className="w-full max-w-[820px] bg-white/[0.3] backdrop-blur-md rounded-[24px] border border-white/60 p-6 sm:p-8 mb-6 shadow-sm flex items-center justify-center">
            <svg className="w-[360px] sm:w-[420px] h-auto" fill="none" viewBox="0 0 420 250" xmlns="http://www.w3.org/2000/svg">
              {/* Dial center at (210, 210), radius R=150 */}
              <path d="M 60 210 A 150 150 0 0 1 88.6 121.8" stroke="#B91C1C" strokeLinecap="round" strokeWidth="14"></path>
              <path d="M 94.6 113.2 A 150 150 0 0 1 205 60.1" stroke="#B45309" strokeLinecap="round" strokeWidth="14"></path>
              <path d="M 215 60.1 A 150 150 0 0 1 360 210" stroke="#047857" strokeLinecap="round" strokeWidth="14"></path>

              {/* Ticks */}
              <g opacity="0.6" stroke="#0B1B33" strokeWidth="1.5">
                <line x1="75" x2="90" y1="210" y2="210"></line>
                <line x1="104" x2="116" y1="135" y2="143"></line>
                <line x1="210" x2="210" y1="75" y2="90"></line>
                <line x1="316" x2="304" y1="135" y2="143"></line>
                <line x1="345" x2="330" y1="210" y2="210"></line>
              </g>

              {/* Labels */}
              <text fill="#991B1B" fontFamily="Inter" fontSize="11" fontWeight="700" x="60" y="235">0%</text>
              <text fill="#92400E" fontFamily="Inter" fontSize="11" fontWeight="700" textAnchor="middle" x="210" y="48">50%</text>
              <text fill="#065F46" fontFamily="Inter" fontSize="11" fontWeight="700" textAnchor="end" x="360" y="235">100%</text>

              {/* Needle pointing at ~85% */}
              <g transform="translate(210, 210)">
                <polygon fill="#0B1B33" points="-4,4 4,-4 116,-66 112,-72"></polygon>
                <circle cx="0" cy="0" fill="#0B1B33" r="14"></circle>
                <circle cx="0" cy="0" fill="white" r="6"></circle>
              </g>

              {/* Metric Value */}
              <g transform="translate(210, 160)">
                <rect fill="white" height="36" rx="18" stroke="#0B1B33" strokeWidth="1.5" width="100" x="-50" y="-18"></rect>
                <text fill="#047857" fontFamily="Plus Jakarta Sans" fontSize="20" fontWeight="800" textAnchor="middle" x="0" y="7">
                  85%
                </text>
              </g>
              <text fill="#0B1B33" fontFamily="Inter" fontSize="11" fontWeight="700" textAnchor="middle" x="210" y="202">
                FEED READINESS
              </text>
            </svg>
          </div>

          <div className="bg-white rounded-[20px] px-6 sm:px-8 py-3.5 shadow-cockpit-pop border border-white mb-6">
            <p className="text-xs sm:text-sm text-[#0B1B33] font-semibold">
              Pantau kesiapan menuju tender dan Stage-Gate.
            </p>
          </div>

          {/* Action Card to Jump Back to Login Form */}
          <div className="bg-white rounded-[24px] p-3.5 sm:p-4 shadow-cockpit-pop border border-white flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <span className="text-xs text-[#4A5A72] font-semibold px-2">
              Siap memulai sesi operasi Anda?
            </span>
            <a
              href="#login-anchor"
              className="inline-flex items-center justify-center px-8 h-11 bg-[#0062CC] text-white rounded-full font-heading text-xs font-bold hover:bg-[#0057B8] active:scale-95 transition-all shadow-xs"
            >
              Masuk
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
