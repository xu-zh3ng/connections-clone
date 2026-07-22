const defaultCategories = [
    { name: "WET WEATHER", color: "var(--easy)", words: ["hail", "rain", "sleet", "snow"] },
    { name: "NBA TEAMS", color: "var(--medium)", words: ["bucks", "heat", "nets", "jazz"] },
    { name: "KEYBOARD KEYS", color: "var(--hard)", words: ["option", "return", "shift", "tab"] },
    { name: "PALINDROMES", color: "var(--extreme)", words: ["kayak", "level", "mom", "race car"] },
];
const maxMistakes = 4;

function getRandomPuzzle() {
    if (typeof PUZZLE_ARCHIVE === "undefined" || PUZZLE_ARCHIVE.length === "0") {
        return defaultCategories;
    }
    const i = Math.floor(Math.random() * PUZZLE_ARCHIVE.length);
    return PUZZLE_ARCHIVE[i];
}

let categories = getRandomPuzzle();

let tiles = [];
let selected = [];
let solved = [];
let mistakesLeft = maxMistakes;
let gameOver = false;

window.onload = function () {
    initTiles();
    buildBoard();
    buildEventListeners();
    buildmistakesLeft();
    console.log(tiles);
}

//fill tiles arr w/ words from categories
function initTiles() {
    tiles = categories.flatMap((cat, i) =>
        cat.words.map(word => ({ word, catIndex: i }))
    );
    shuffleTiles(tiles);
}

function shuffleTiles(tiles) {
    //Fisher-Yates shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
        const random = Math.floor(Math.random() * (i + 1));

        //swap current element with a random element earlier in the array
        [tiles[i], tiles[random]] = [tiles[random], tiles[i]];
    }
}
//initTiles();
//console.log(tiles);

//now we make the board of 16 buttons and fill the inner text of the button w word
//and the class w catindex

function buildBoard() {
    let grid = document.getElementById("grid");
    grid.innerHTML = "";

    const unsolvedTiles = tiles.filter(tile => !solved.includes(tile.catIndex))

    for (let tile of unsolvedTiles) {
        let button = document.createElement("button");
        button.textContent = tile.word;
        button.dataset.catIndex = tile.catIndex;
        button.classList.add("tile");
        if (selected.includes(tile.word)) {
            button.classList.add("selected");
        }

        button.addEventListener("click", () => {
            toggleTile(tile.word)
        });

        grid.appendChild(button);
    }
}

function buildmistakesLeft() {
    let dots = document.getElementById("dots");
    dots.innerHTML = "";

    for (let i = 0; i < maxMistakes; i++) {
        const dot = document.createElement("span");
        dot.classList.add("dot");
        dot.id = `dot-${i + 1}`;
        dots.appendChild(dot);
    }
}

function toggleTile(word) {
    if (gameOver) return;

    //if word already selected, deselect it
    if (selected.includes(word)) {
        //.filter rebuilds array w/ elements that match condition
        //since condition is that w !== word, it removes word by not including it in rebuild
        selected = selected.filter(w => w !== word);
    }
    else {
        if ((selected.length < 4)) {
            selected.push(word);
        }
    }

    let button = document.getElementById("submit");
    if (selected.length === 4) {
        button.disabled = false;
        button.classList.add("selected");
    }
    else {
        button.disabled = true;
        button.classList.remove("selected");
    }
    buildBoard();
}

function buildEventListeners() {
    let buttons = document.querySelectorAll(".button");
    buttons.forEach(button => {
        button.addEventListener("click", () => {
            handleInput(button.id);
        })
    });
    let replay = document.getElementById("replay");
    replay.addEventListener("click", () => {
        playAgain();
    });
    replay.style.opacity = "0";
    replay.classList.add("locked");
}

function handleInput(input) {
    if (input === "shuffle") {
        shuffleTiles(tiles);
        buildBoard();
    }

    else if (input === "deselect") {
        selected = [];
        let button = document.getElementById("submit");
        button.disabled = true;
        button.classList.remove("selected");
        buildBoard();
    }

    else if (input === "submit") {
        //add "bounce" css
        const selectedButtons = document.querySelectorAll(".selected");
        selectedButtons.forEach((button, i) => {
            button.style.animationDelay = `${i * 0.2}s`;
            button.classList.add("bounce");
            button.addEventListener("animationend", () => {
                button.classList.remove("bounce");
                button.style.animationDelay = "";
            })
        })
        let button = document.getElementById("submit");
        button.disabled = true;

        setTimeout(() => {
            button.classList.remove("selected");
            update();
        }, 800)

    }

    else {
        console.warn("how did this get here?")
    }
}

function update() {
    if (gameOver) { console.log("gameover"); return; }

    if (selected.length !== 4) {
        console.log("how did this get here?")
        return;
    }
    //console.log("submitted");

    const catIndices = selected.map(word => tiles.find(t => t.word === word).catIndex)
    // line above is same as saying 
    // for(const word of selected){
    //     const tile = tiles.find(t => t.word === word)
    //     catIndices.push(tile.catIndex)
    // } ; just that .map() is a shorter way of writing build a new array by transforming each element of the one given

    const counts = {};
    catIndices.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
    })

    //Object.values() just turns it from a dict w/ kv pairs to a list of values(tosses the key)
    const maxCount = Math.max(...Object.values(counts));

    if (maxCount === 4) {
        handleCorrect();
        if (solved.length === categories.length) {
            gameOver = true;
            endGame(true);
        }
    }
    else {
        if (maxCount === 3) {
            let popup = document.getElementById("popup");
            popup.textContent = "One away...";
            popup.classList.add("show");

            setTimeout(() => {
                popup.classList.remove("show");
            }, 1000);
        }
        const buttons = document.querySelectorAll(".selected");
        buttons.forEach(button => {
            button.classList.add("shake");
            button.addEventListener("animationend", () => {
                button.classList.remove("shake");
            })
        })
        showmistakesLeft();
        if (mistakesLeft <= 0) {
            gameOver = true;
            endGame(false);
        }
    }
}

function showmistakesLeft() {
    if (mistakesLeft <= 0) return;

    let dot = document.getElementById(`dot-${mistakesLeft}`);
    dot.classList.add("hidden");
    mistakesLeft--;
}

function handleCorrect() {
    const catIndex = tiles.find(t => t.word === selected[0]).catIndex;
    solved.push(catIndex);
    selected = [];

    buildBoard();
    buildSolved(catIndex);
}

function buildSolved(catIndex) {
    let solvedBoard = document.getElementById("solved");

    const cat = categories[catIndex];

    const row = document.createElement("div");
    row.classList.add("solved-row");
    row.style.backgroundColor = cat.color;

    const name = document.createElement("div");
    name.classList.add("solved-name");
    name.textContent = cat.name;

    const words = document.createElement("div");
    words.classList.add("solved-words");
    words.textContent = cat.words.join(", ");

    row.appendChild(name);
    row.appendChild(words);
    solvedBoard.appendChild(row);

    row.offsetHeight;
    row.classList.add("show");

}

function endGame(won) {
    if (!won) {
        let grid = document.getElementById("grid");
        grid.innerHTML = "";
        categories.forEach((cat, i) => {
            if (!solved.includes(i)) {
                setTimeout(() => {
                    buildSolved(i);
                }, i * 500);
            }
        });
        let buttons = document.querySelectorAll("button");
        buttons.forEach(button => {
            button.classList.add("locked");
        });
    }

    let popup = document.getElementById("popup");
    popup.textContent = won ? "Solved!" : "Better luck next time!";
    setTimeout(() => {
        popup.classList.add("show");
        let replay = document.getElementById("replay");
        replay.style.opacity = "1";
        replay.classList.remove("locked");
    }, 2000);

    setTimeout(() => {
        popup.classList.remove("show");
    }, 3000);
}

function playAgain() {
    tiles = [];
    selected = [];
    solved = [];
    mistakesLeft = maxMistakes;
    gameOver = false;

    document.getElementById("solved").innerHTML = "";

    let replay = document.getElementById("replay");
    replay.style.opacity = "0";
    replay.classList.add("locked");

    initTiles();
    buildBoard();
    buildmistakesLeft();
}