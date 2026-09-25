import { useEffect, useState } from 'react'
import './App.css'

const initialForm = { email: '', password: '' }
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

function App() {
	const [screen, setScreen] = useState('login')
	const [form, setForm] = useState(initialForm)
	const [message, setMessage] = useState('')
	const [loading, setLoading] = useState(false)
	const [user, setUser] = useState(null)

	const submitAuth = async (event) => {
		event.preventDefault(); setMessage('')
		if (!form.email.trim() || !form.password.trim()) return setMessage('Please enter your email and password.')
		if (!form.email.includes('@') || form.password.length < 6) return setMessage('Use a valid email and a password with at least 6 characters.')
		setLoading(true)
		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/${screen}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
			const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Something went wrong.')
			setUser(data.user); setScreen('dashboard'); setForm(initialForm)
		} catch (error) {
			setMessage(error.message === 'Failed to fetch' ? 'Cannot reach the server. Start the backend with "npm run dev" from the backend folder.' : error.message)
		} finally { setLoading(false) }
	}

	if (screen === 'dashboard') return <Dashboard user={user} onSignOut={() => { setUser(null); setScreen('login') }} />
	return (
		<main className="auth-page">
			<div className="auth-art" aria-hidden="true"><div className="art-copy"><span>prime</span><strong>Watch what you love.</strong></div></div>
			<section className="auth-panel">
				<div className="brand"><span className="brand-mark">a</span> amazon<span className="brand-smile">~</span></div>
				<div className="auth-card"><p className="eyebrow">Welcome to Prime Video</p><h1>{screen === 'login' ? 'Sign in' : 'Create account'}</h1><p className="auth-intro">{screen === 'login' ? 'Sign in to continue watching.' : 'Join Prime Video and start streaming today.'}</p>
					<form onSubmit={submitAuth}><label htmlFor="email">Email or mobile number</label><input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" /><label htmlFor="password">Password</label><input id="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete={screen === 'login' ? 'current-password' : 'new-password'} />{message && <p className="form-error" role="alert">{message}</p>}<button className="primary-button" disabled={loading}>{loading ? 'Please wait...' : screen === 'login' ? 'Sign in' : 'Create your account'}</button></form>
					{screen === 'login' && <p className="help-link">Forgot your password?</p>}<div className="switch-auth"><span>{screen === 'login' ? 'New to Prime Video?' : 'Already have an account?'}</span><button onClick={() => { setScreen(screen === 'login' ? 'signup' : 'login'); setMessage('') }}>{screen === 'login' ? 'Create your Amazon account' : 'Sign in instead'}</button></div>
				</div><footer>© 1996-2026, Amazon.com, Inc. or its affiliates &nbsp;·&nbsp; Terms &nbsp;·&nbsp; Privacy Notice</footer>
			</section>
		</main>
	)
}

function Dashboard({ user, onSignOut }) {
	const [movies, setMovies] = useState([]); const [loading, setLoading] = useState(true); const [loadedPage, setLoadedPage] = useState(''); const [error, setError] = useState('')
	const [page, setPage] = useState('Home')
	const [selectedMovie, setSelectedMovie] = useState(null)
	useEffect(() => {
		const category = page === 'Movies' || page === 'Home' ? 'movies' : 'tv'
		fetch(`${API_BASE_URL}/api/content/${category}`).then((response) => response.json().then((data) => ({ response, data }))).then(({ response, data }) => { if (!response.ok) throw new Error(data.message || 'Unable to load titles.'); setMovies(data.results || []); setError(''); setLoadedPage(page) }).catch((requestError) => { setError(requestError.message); setLoadedPage(page) }).finally(() => setLoading(false))
	}, [page])
	const navigate = (nextPage) => { setSelectedMovie(null); setPage(nextPage); window.scrollTo({ top: 0, behavior: 'smooth' }) }
	const visibleMovies = page === 'Movies' ? movies : movies.slice(0, 6)
	const pageMovies = loadedPage === page ? visibleMovies : []
	const pageError = loadedPage === page ? error : ''
	return <main className="dashboard"><nav className="topbar"><div className="brand"><span className="brand-mark">a</span> amazon<span className="brand-smile">~</span></div><div className="nav-links">{['Home', 'Movies', 'TV shows', 'Live TV'].map((item) => <button className={page === item ? 'active' : ''} key={item} onClick={() => navigate(item)}>{item}</button>)}</div><div className="account"><span className="avatar">{user?.email?.[0]?.toUpperCase() || 'A'}</span><span>{user?.email}</span><button onClick={onSignOut}>Sign out</button></div></nav>{page === 'Home' && <section className="welcome-hero"><div><p className="eyebrow">Prime Video</p><h1>Find your next<br /><em>great story.</em></h1><p>Stream thousands of popular movies and shows, included with your membership.</p><button className="primary-button browse-button" onClick={() => navigate('Movies')}>Explore the collection</button></div></section>}{page !== 'Home' && <section className="page-heading"><p className="eyebrow">Prime Video</p><h1>{page}</h1><p>{page === 'Movies' ? 'Popular films, newly released and ready to stream.' : `Discover ${page.toLowerCase()} available on Prime Video.`}</p></section>}<section className="catalog"><div className="section-heading"><div><p className="eyebrow">Curated for you</p><h2>{page === 'Home' ? 'Popular movies' : page === 'Movies' ? 'All movies' : `Featured ${page.toLowerCase()}`}</h2></div><span>Powered by TMDB</span></div>{loading && <p className="catalog-status">Loading the latest titles...</p>}{pageError && <div className="catalog-status form-error"><p>{pageError}</p>{pageError.includes('TMDB_API_KEY') && <p className="setup-hint">Create <strong>backend/.env</strong> with <strong>TMDB_API_KEY=your_key</strong>, then restart the backend.</p>}</div>}{!loading && !pageError && pageMovies.length === 0 && <p className="catalog-status">No titles available yet.</p>}<div className="movie-grid">{pageMovies.map((movie) => <article className="movie-card" key={movie.id}><img src={movie.poster} alt={movie.title} /><div className="movie-info"><h3>{movie.title}</h3><p>{movie.year} &nbsp;·&nbsp; {movie.rating.toFixed(1)} ★</p><button className="play-button" onClick={() => setSelectedMovie(movie)}>▶ Play 30 sec preview</button></div></article>)}</div></section>{selectedMovie && <div className="modal-backdrop" onClick={() => setSelectedMovie(null)}><div className="trailer-modal" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setSelectedMovie(null)} aria-label="Close trailer">×</button><h2>{selectedMovie.title}</h2>{selectedMovie.trailer.includes('.mp4') ? <video src={selectedMovie.trailer} autoPlay controls playsInline onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 30) event.currentTarget.pause() }} /> : <iframe title={`${selectedMovie.title} trailer`} src={`${selectedMovie.trailer.replace('watch?v=', 'embed/')}?autoplay=1&start=0&end=30`} allow="autoplay; encrypted-media" allowFullScreen />}<p className="preview-note">Preview ends automatically after 30 seconds.</p></div></div>}</main>
}

export default App
