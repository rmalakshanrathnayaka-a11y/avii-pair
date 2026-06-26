/**
 * @project : Anoboy - Anime Search & Downloader API (rewired to Gogoanime)
 * @author : Kayllano Aveline 👨💻
 * @license : MIT / Personal
 */
const axios = require("axios")
const cheerio = require("cheerio")

const API = "https://consumet-api-eta.vercel.app/anime/gogoanime"

async function searchAnoboy(query) {
  if (!query) throw new Error("Query kosong")
  try {
    const { data } = await axios.get(`${API}/${encodeURIComponent(query)}`, { timeout: 20000 })
    const results = (data.results || []).map(a => ({
      title: a.title,
      url: `${API}/info/${a.id}`, // අපි id එක url එක විදිහට store කරනවා
      thumbnail: a.image || null,
      status: null,
      type: a.subOrDub || null,
      subtitle: null,
      episode: null
    }))
    return { code:200, timestamp:Date.now(), data:{ query, search_title:`Search '${query}'`, total_results:results.length, results } }
  } catch(e){ throw new Error(`Gagal mencari anime: ${e.message}`) }
}

async function getAnimeDetail(url) {
  if (!url) throw new Error("URL kosong")
  try {
    const id = url.split('/info/')[1]
    const { data } = await axios.get(`${API}/info/${id}`, { timeout:20000 })
    const episodeList = (data.episodes || []).reverse().map(ep => ({
      episode: ep.number?.toString(),
      title: `Episode ${ep.number}`,
      url: `${API}/watch/${ep.id}`,
      release_date: null
    }))
    return {
      code:200, timestamp:Date.now(),
      data:{
        title: data.title,
        url,
        thumbnail: data.image,
        rating: null, rating_percent:null, status:data.status, type:data.type,
        episodes_total: data.totalEpisodes,
        released:data.releaseDate, season:null, studio:null,
        genres:data.genres||[],
        synopsis:data.description,
        characters:[],
        first_episode: episodeList[episodeList.length-1]||null,
        last_episode: episodeList[0]||null,
        episode_list: episodeList,
        recommendations:[]
      }
    }
  } catch(e){ throw new Error(`Gagal detail: ${e.message}`) }
}

async function getEpisodeDetail(url) {
  if (!url) throw new Error("URL kosong")
  try {
    const epId = url.split('/watch/')[1]
    const { data } = await axios.get(`${API}/watch/${epId}`, { timeout:20000 })
    // best quality 720p or 360p
    const source = data.sources.find(s => s.quality === '720p') || data.sources.find(s => s.quality === '480p') || data.sources[0]
    const downloadLinks = data.sources.map(s => ({ quality:s.quality, url:s.url, size:null }))
    return {
      code:200, timestamp:Date.now(),
      data:{ title: epId, url, video_iframe:null, download_links: downloadLinks }
    }
  } catch(e){ throw new Error(`Gagal episode: ${e.message}`) }
}

module.exports = { searchAnoboy, getAnimeDetail, getEpisodeDetail }