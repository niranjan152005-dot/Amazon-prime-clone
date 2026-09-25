import 'dotenv/config'
import express from 'express'

const app = express(); const port = process.env.PORT || 5000
const users = new Map([['demo@amazon.com', { email: 'demo@amazon.com', password: 'password' }]])
app.use(express.json())
app.post('/api/auth/signup', (request, response) => { const { email, password } = request.body; const normalizedEmail = email.trim().toLowerCase(); if (users.has(normalizedEmail)) return response.status(409).json({ message: 'An account with this email already exists.' }); users.set(normalizedEmail, { email: normalizedEmail, password }); return response.status(201).json({ user: { email: normalizedEmail } }) })
app.post('/api/auth/login', (request, response) => { const { email, password } = request.body; const user = users.get(email.trim().toLowerCase()); if (!user || user.password !== password) return response.status(401).json({ message: 'The email or password is incorrect.' }); return response.json({ user: { email: user.email } }) })
app.get('/api/content/:category', async (request, response) => {
	if (!process.env.TMDB_API_KEY && request.params.category === 'movies') {
		try {
			const fallbackResponse = await fetch('https://api.sampleapis.com/movies/drama')
			if (!fallbackResponse.ok) throw new Error('Fallback movie request failed')
			const fallbackMovies = await fallbackResponse.json()
			return response.json({ results: fallbackMovies.slice(0, 12).map((movie, index) => ({ id: `fallback-${index}`, title: movie.title, year: movie.year || 'Classic', rating: Number(movie.imdbRating) || 0, poster: movie.posterURL, trailer: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' })) })
		} catch { return response.status(502).json({ message: 'Movie images are temporarily unavailable.' }) }
	}
	if (!process.env.TMDB_API_KEY) return response.status(503).json({ message: 'TMDB_API_KEY is missing. Add it to backend/.env for TV show images.' })
	const endpoint = request.params.category === 'movies' ? 'trending/movie/week' : 'trending/tv/week'
	try {
		const apiResponse = await fetch(`https://api.themoviedb.org/3/${endpoint}?api_key=${process.env.TMDB_API_KEY}`)
		if (!apiResponse.ok) throw new Error('TMDB request failed')
		const data = await apiResponse.json()
		const results = await Promise.all(data.results.slice(0, 12).map(async (item) => {
			const detailResponse = await fetch(`https://api.themoviedb.org/3/${request.params.category === 'movies' ? 'movie' : 'tv'}/${item.id}?api_key=${process.env.TMDB_API_KEY}&append_to_response=videos`)
			const detail = detailResponse.ok ? await detailResponse.json() : item
			const trailer = detail.videos?.results?.find((video) => video.site === 'YouTube' && video.type === 'Trailer')
			return { id: item.id, title: item.title || item.name, year: (item.release_date || item.first_air_date)?.slice(0, 4) || 'Coming soon', rating: item.vote_average, poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://placehold.co/500x750/101e2f/e8edf4?text=No+poster', trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '' }
		}))
		return response.json({ results })
	} catch { return response.status(502).json({ message: 'Movie service is temporarily unavailable.' }) }
})

app.get('/api/movies', (request, response) => response.redirect('/api/content/movies'))
app.listen(port, () => console.log(`Amazon clone API listening on http://localhost:${port}`))