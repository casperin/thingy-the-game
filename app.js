const button = document.querySelector("#btn")
const pointsEl = document.querySelector("#points")
const livesEl = document.querySelector("#lives")
const youEl = document.querySelector("#you")
const canvas = document.querySelector("#canvas")
const ctx = canvas.getContext("2d")

const winX = window.innerWidth
const winY = window.innerHeight

canvas.width = winX
canvas.height = winY

const starties = {
    speed: 2,
    points: 0,
    lives: 5,
}

function reset() {
    speed = starties.speed
    points = starties.points
    lives = starties.lives
    running = true
}

let speed
let points
let lives
let invincible
// --
let loopId
let angle = 0
let running = false

const squareSize = 50
const badSquares = []
const goodSquares = []
const makeSquare = () => ({
    x: Math.random() * winX,
    y: Math.random() * winY
})
for (var i = 0; i < 5; i++) badSquares.push(makeSquare())
for (var i = 0; i < 10; i++) goodSquares.push(makeSquare())

const you = {
    x: parseInt(winX / 2),
    y: parseInt(winY / 2)
}

function makeInvincible() {
    invincible = true
    document.body.classList.add("invincible")
    setTimeout(() => {
        document.body.classList.remove("invincible")
        invincible = false
    }, 2000)
}

function setPoints(p) {
    points = p
    pointsEl.innerHTML = points
}

function removeLife() {
    lives--
    updateLifeEl()
    if (lives < 1) {
        running = false
        clearInterval(loopId)
        alert("Oh no! You died!! You got " + points + " points.")
        if (confirm("Play again?")) {
            makeInvincible()
            start()
        }
    } else {
        makeInvincible()
    }
}

function updateLifeEl() {
    livesEl.innerHTML = ""
    for (var i = 0; i < lives; i++) livesEl.innerHTML += "&hearts;"
}


button.addEventListener("click", async function connect() {
    const device = await navigator.bluetooth.requestDevice({
        filters: [{services: ['ef680100-9b35-4933-9b10-52ffa9740042']}],
        optionalServices: [
            "ef680200-9b35-4933-9b10-52ffa9740042",
            "ef680300-9b35-4933-9b10-52ffa9740042",
            "ef680400-9b35-4933-9b10-52ffa9740042",
            "ef680500-9b35-4933-9b10-52ffa9740042"
        ]
    })
    const server = await device.gatt.connect()
    document.body.classList.add("connected")
    const serviceMotion = await server.getPrimaryService('ef680400-9b35-4933-9b10-52ffa9740042')
    const characteristicHeading = await serviceMotion.getCharacteristic('ef680409-9b35-4933-9b10-52ffa9740042')
    characteristicHeading.addEventListener('characteristicvaluechanged', function (event) {
        let rawValue = event.target.value.getInt32(0, true)
        angle = parseInt(rawValue / 65536)
        youEl.style.transform = `rotate(${angle}deg)`
    })
    characteristicHeading.startNotifications()
    start()
})

async function start() {
    reset()
    updateLifeEl()
    setPoints(points)
    makeInvincible() // start game as invincible

    loopId = setInterval(() => {
        if (!running) {
            clearInterval(loopId)
            return
        }
        if (points / 50 > speed) {
            speed++
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for (const s of goodSquares) {
            updateSquare(s)
            const onTop = squareOnYou(s)
            drawSquare(s, onTop ? "limegreen" : "forestgreen")
            if (onTop) setPoints(points + 1)
        }
        for (const s of badSquares) {
            updateSquare(s)
            drawSquare(s, "#900")
            if (squareOnYou(s)) removeLife()
        }
    }, 16)
}

function updateSquare(s) {
    let x = s.x + cos(angle) * speed
    let y
    let doY = true

    if (x < -squareSize) {
        doY = false
        x = x + winX + squareSize
        y = Math.random() * winY
    }
    if (x > winX) {
        doY = false
        x = (x % winX) - squareSize
        y = Math.random() * winY
    }

    if (doY) {
        y = s.y + sin(angle) * speed
        if (y < -squareSize) {
            y = y + winY + squareSize
            x = Math.random() * winX
        }
        if (y > winY) {
            y = (y % winY) - squareSize
            x = Math.random() * winX
        }
    }

    s.x = x
    s.y = y
}

const cos = deg => Math.cos(deg * (Math.PI / 180))
const sin = deg => Math.sin(deg * (Math.PI / 180))

function drawSquare(s, color, cb) {
    ctx.fillStyle = color
    ctx.fillRect(s.x, s.y, squareSize, squareSize)
}

function squareOnYou(s) {
    if (invincible) return false
    if (s.x > you.x || s.x + squareSize < you.x) return false
    if (s.y > you.y || s.y + squareSize < you.y) return false
    return true
}
