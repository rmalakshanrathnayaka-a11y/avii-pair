const fs = require('fs')
const path = require('path')

function getBotId(sock) {
    try {
        return sock?.user?.id?.split(':')[0] || 'main'
    } catch { return 'main' }
}

function getPath(sock, name) {
    const id = getBotId(sock)
    const dir = './data'
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return path.join(dir, `${id}_${name}.json`)
}

function read(sock, name, def = {}) {
    const p = getPath(sock, name)
    if (!fs.existsSync(p)) {
        fs.writeFileSync(p, JSON.stringify(def, null, 2))
        return def
    }
    try { return JSON.parse(fs.readFileSync(p)) }
    catch { return def }
}

function write(sock, name, data) {
    const p = getPath(sock, name)
    fs.writeFileSync(p, JSON.stringify(data, null, 2))
}

module.exports = { getBotId, read, write }