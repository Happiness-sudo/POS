interface LoginPageProps { onSignIn: () => void }

export default function LoginPage({ onSignIn }: LoginPageProps) {
  return <main className="login-page"><form className="login-card" onSubmit={event => { event.preventDefault(); onSignIn(); }}>
    <div className="brandmark">K</div><span className="eyebrow">KARIBU MART · STAFF PORTAL</span><h1>Welcome back</h1><p className="muted">Sign in to start your shift</p>
    <label>Phone or email<input placeholder="0712 345 678" autoComplete="username" /></label>
    <label>Password or PIN<input placeholder="Enter your PIN" type="password" autoComplete="current-password" /></label>
    <button className="primary login-submit">Log in <span>→</span></button><button className="link-button" type="button">Forgot PIN? Ask the owner to reset it</button>
    <div className="secure-note"><span className="secure-dot"/> Secure staff sign in</div>
  </form><div className="login-foot">Simple sales. Clear records.</div></main>
}
