import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";
import config from "@/config";

const AlfredLogo = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="25" rx="35" ry="8" fill="currentColor" />
    <ellipse cx="50" cy="22" rx="22" ry="12" fill="currentColor" />
    <circle cx="50" cy="50" r="25" fill="#F5DEB3" stroke="currentColor" strokeWidth="2" />
    <circle cx="60" cy="47" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
    <line x1="68" y1="47" x2="78" y2="55" stroke="currentColor" strokeWidth="2" />
    <path d="M38 42 Q43 38 48 42" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M52 42 Q57 38 62 42" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="43" cy="47" r="2" fill="currentColor" />
    <circle cx="60" cy="47" r="2" fill="currentColor" />
    <path d="M40 58 Q50 62 60 58" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M35 80 L50 75 L65 80 L50 85 Z" fill="currentColor" />
  </svg>
);

export default function Page() {
  return (
    <>
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <AlfredLogo className="w-8 h-8 text-primary" />
          <span className="font-bold text-xl">{config.appName}</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="#features" className="link link-hover text-sm">Features</Link>
          <Link href="#pricing" className="link link-hover text-sm">Pricing</Link>
          <Link href="#faq" className="link link-hover text-sm">FAQ</Link>
          <ButtonSignin text="Login" />
        </nav>
      </header>
      <main>
        <section className="flex flex-col items-center justify-center text-center gap-8 px-8 py-24 bg-gradient-to-b from-base-100 to-base-200">
          <AlfredLogo className="w-20 h-20 text-primary" />
          <h1 className="text-5xl md:text-6xl font-extrabold max-w-4xl">Meet <span className="text-primary">Alfred</span>, Your AI Butler</h1>
          <p className="text-xl opacity-80 max-w-2xl">Zero-config AI automation platform with dedicated infrastructure. Let Alfred handle your repetitive tasks while you focus on what matters.</p>
          <div className="flex gap-4">
            <ButtonSignin text="Get Started" extraStyle="btn-primary btn-lg" />
            <Link href="#features" className="btn btn-outline btn-lg">Learn More</Link>
          </div>
        </section>
        <section className="py-24 px-8 bg-base-200">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Tired of Manual Tasks?</h2>
            <p className="text-center text-lg opacity-70 mb-16 max-w-2xl mx-auto">Managing credentials, configuring automations, and maintaining infrastructure shouldn&apos;t be your full-time job.</p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card bg-base-100 shadow-xl"><div className="card-body"><div className="text-4xl mb-4">⏰</div><h3 className="card-title">Hours Wasted on Setup</h3><p className="opacity-70">Traditional automation tools require extensive configuration.</p></div></div>
              <div className="card bg-base-100 shadow-xl"><div className="card-body"><div className="text-4xl mb-4">🔐</div><h3 className="card-title">Credential Security Risks</h3><p className="opacity-70">Sharing API keys with third-party services puts your data at risk.</p></div></div>
              <div className="card bg-base-100 shadow-xl"><div className="card-body"><div className="text-4xl mb-4">🔧</div><h3 className="card-title">Constant Maintenance</h3><p className="opacity-70">Keeping automations running requires ongoing attention.</p></div></div>
            </div>
          </div>
        </section>
        <section id="features" className="py-24 px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why Choose Alfred?</h2>
            <p className="text-center text-lg opacity-70 mb-16 max-w-2xl mx-auto">Alfred combines AI with dedicated infrastructure for seamless automation.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🚀</span></div><h3 className="font-bold text-lg mb-2">Zero-Config</h3><p className="opacity-70">Get started in minutes. Alfred handles setup.</p></div>
              <div className="text-center"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🏠</span></div><h3 className="font-bold text-lg mb-2">Data Sovereignty</h3><p className="opacity-70">Your credentials stay on your infrastructure.</p></div>
              <div className="text-center"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🧩</span></div><h3 className="font-bold text-lg mb-2">Extensible</h3><p className="opacity-70">Build custom skills and integrations.</p></div>
              <div className="text-center"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🧠</span></div><h3 className="font-bold text-lg mb-2">Self-Teaching</h3><p className="opacity-70">Alfred learns from your patterns.</p></div>
            </div>
          </div>
        </section>
        <section id="pricing" className="py-24 px-8 bg-base-200">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
            <p className="text-center text-lg opacity-70 mb-16 max-w-2xl mx-auto">One plan, everything included.</p>
            <div className="max-w-md mx-auto">
              <div className="card bg-base-100 shadow-2xl border-2 border-primary">
                <div className="card-body text-center">
                  <div className="badge badge-primary badge-lg mx-auto mb-4">Most Popular</div>
                  <h3 className="text-2xl font-bold">Alfred Pro</h3>
                  <p className="opacity-70 mb-4">Your personal AI butler</p>
                  <div className="mb-6"><span className="text-lg line-through opacity-50">$49</span><span className="text-5xl font-bold ml-2">$29</span><span className="opacity-70">/month</span></div>
                  <ul className="text-left space-y-3 mb-8">
                    {["Dedicated AI infrastructure","Zero-config deployment","Full data sovereignty","Extensible plugins","Self-teaching","Priority support"].map((f,i)=>(<li key={i} className="flex items-center gap-2"><svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>{f}</li>))}
                  </ul>
                  <ButtonSignin text="Start Free Trial" extraStyle="btn-primary btn-lg w-full" />
                  <p className="text-sm opacity-50 mt-4">14-day free trial. No credit card required.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="faq" className="py-24 px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Frequently Asked Questions</h2>
            <p className="text-center text-lg opacity-70 mb-16">Everything you need to know about Alfred</p>
            <div className="space-y-4">
              {[{q:"What is Alfred?",a:"An AI automation platform that handles tasks while keeping data secure."},{q:"How does data sovereignty work?",a:"Alfred runs on your infrastructure. Your credentials never leave."},{q:"What is zero-config?",a:"Get started without complex setup. Alfred handles everything."},{q:"Can I build integrations?",a:"Yes! Extensible plugin system for custom skills."},{q:"Free trial?",a:"14-day free trial, full features, no credit card."}].map((item,i)=>(<div key={i} className="collapse collapse-arrow bg-base-200"><input type="radio" name="faq" defaultChecked={i===0}/><div className="collapse-title text-lg font-medium">{item.q}</div><div className="collapse-content"><p className="opacity-70">{item.a}</p></div></div>))}
            </div>
          </div>
        </section>
        <section className="py-24 px-8 bg-primary text-primary-content">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Meet Your AI Butler?</h2>
            <p className="text-xl opacity-90 mb-8">Join thousands who trust Alfred for automation.</p>
            <ButtonSignin text="Get Started Free" extraStyle="btn-secondary btn-lg" />
          </div>
        </section>
      </main>
      <footer className="bg-base-200 border-t border-base-content/10">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2"><AlfredLogo className="w-8 h-8 text-primary" /><span className="font-bold text-xl">{config.appName}</span></div>
            <nav className="flex gap-6 text-sm">
              <Link href="#features" className="link link-hover">Features</Link>
              <Link href="#pricing" className="link link-hover">Pricing</Link>
              <Link href="#faq" className="link link-hover">FAQ</Link>
              <Link href="/tos" className="link link-hover">Terms</Link>
              <Link href="/privacy-policy" className="link link-hover">Privacy</Link>
              {config.resend.supportEmail && <a href={`mailto:${config.resend.supportEmail}`} className="link link-hover">Support</a>}
            </nav>
          </div>
          <div className="text-center mt-8 text-sm opacity-60">© {new Date().getFullYear()} {config.appName}. All rights reserved.</div>
        </div>
      </footer>
    </>
  );
}
