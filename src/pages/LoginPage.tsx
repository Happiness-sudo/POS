interface LoginPageProps { onSignIn: () => void }

export default function LoginPage({ onSignIn }: LoginPageProps) {
  return <main className="login-page"><form className="login-card" onSubmit={event => { event.preventDefault(); onSignIn(); }}>
    <h1>[SHOP NAME]</h1><p className="muted">Sign in to start your shift</p>
    <label>Phone or email<input placeholder="0712 345 678" autoComplete="username" /></label>
    <label>Password or PIN<input placeholder="PIN" type="password" autoComplete="current-password" /></label>
    <button className="primary login-submit">Log in</button><button className="link-button" type="button">Forgot PIN? Ask the owner to reset it</button>
  </form><div className="login-foot">Simple sales. Clear records.</div></main>;
}
