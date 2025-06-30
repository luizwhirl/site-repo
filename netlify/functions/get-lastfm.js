exports.handler = async function(event, context) {
    const API_KEY = process.env.LASTFM_API_KEY; 
    const USERNAME = 'osaksa';
    const API_URL = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=1`;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data) 
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Falha ao buscar dados do Last.fm' })
        };
    }
};