const scoreDisplay = document.getElementById('score')
const board = document.getElementById('game-board')
const duplicateButton = document.getElementById('duplicate-button')
const levelCounter = document.getElementById('level-counter')

// Game Variables

let score = 0;
let level = 0

let boardWidth = -1
let boardNumbers = []           // empty cells should be represented with -1

let selected = {
    firstSelection: null,
    secondSelection: null
}

const maxDuplications = 5
let duplicationsLeft = maxDuplications

/**
 * Helper function that clears the `selected` object and updates the cells
 * currently selected
 */
const clearSelected = () => {
    if (selected.firstSelection) selected.firstSelection.dataset.selected = "false"
    if (selected.secondSelection) selected.secondSelection.dataset.selected = "false"

    selected.firstSelection = null
    selected.secondSelection = null
}


/**
 * Resets the board for a round of the game
 * 
 * @param {number} width The number of cells in each row of the game board 
 */
const resetBoard = (width = 9) => {
    boardWidth = width
    const initialNumberQuantity = Math.floor(Math.random() * width) + 3 * width
    const rows = Math.ceil( initialNumberQuantity / width)

    board.style['gridAutoColumns'] = `repeat(${width}, 1fr)`;

    boardNumbers = []
    board.innerHTML = ""
    duplicationsLeft = maxDuplications
    level++;
    levelCounter.innerText = `Level: ${level}`
    duplicateButton.innerText = `+(${duplicationsLeft})`

    for (let i = 0; i < initialNumberQuantity; i++) {
        boardNumbers.push( Math.floor(Math.random() * 9) + 1 );
        

        board.insertAdjacentHTML(
            'beforeend', 
            `<div class="number-cell" data-value="${boardNumbers[i]}" data-active="true" data-selected="false"><p>${boardNumbers[i]}</p></div>`
        )
        
    }

    document.querySelectorAll('.number-cell').forEach(cell => {
        cell.removeEventListener('click', cellClickEvent)
        cell.addEventListener('click', cellClickEvent)
    })

    clearSelected()
}

/**
 * Helper function that should be passed into an event listener.
 * Updates the `selected` object in occordance with which cells are selected
 * and, if two unique are selected, to initiate a cell check to try
 * and match them.
 * 
 * @param {Event} event 
 */
const cellClickEvent = (event) => {
    const cell = event.target.closest('.number-cell')
    if (cell.dataset.active === "false") return
            
    if (!selected.firstSelection) {
        selected.firstSelection = cell
        cell.dataset.selected = "true"
    } else if (selected.firstSelection === cell){
        selected.firstSelection = null;
        cell.dataset.selected = "false"
    } else {
        selected.secondSelection = cell;
        cell.dataset.selected = "true"
        checkSelections()
    }
    console.log(selected)

    if (boardNumbers.length === 0) {
        addScore(200 * level)
        resetBoard()

    }
}

duplicateButton.addEventListener('click', () => {
    if (duplicationsLeft <= 0) return;

    let currentNumberLength = boardNumbers.length;
    for (let i = 0; i < currentNumberLength; i++) {
        if (boardNumbers[i] !== -1) {
            boardNumbers.push( boardNumbers[i] );
        
            board.insertAdjacentHTML(
                'beforeend', 
                `<div class="number-cell" data-value="${boardNumbers[i]}" data-active="true" data-selected="false"><p>${boardNumbers[i]}</p></div>`
            )
        }

        document.querySelectorAll('.number-cell').forEach(cell => {
            cell.removeEventListener('click', cellClickEvent)
            cell.addEventListener('click', cellClickEvent)
        })
    }

    duplicationsLeft--;
    duplicateButton.innerText = `+(${duplicationsLeft})`
})


/**
 * Adds to the game score
 * 
 * @param {number} amount The amount to add to the score
 */
const addScore = (amount) => {
    score += amount
    scoreDisplay.innerText = score;
}

/**
 * Responsible for checking whether the two calls selected by `selected`
 * can be matched together
 * 
 * @returns {void}
 */
const checkSelections = () => {

    // can the numbers of the cells be matched?
    let firstNumber = Number(selected.firstSelection.dataset.value)
    let secondNumber = Number(selected.secondSelection.dataset.value)
    if (firstNumber + secondNumber !== 10 && firstNumber !== secondNumber) {
        selected.firstSelection.dataset.selected = "false"
        selected.secondSelection.dataset.selected = "false"

        clearSelected()

        return
    }

    // position variables
    let firstSelectionIndex = [...board.childNodes].indexOf(selected.firstSelection)
    let firstColumn = firstSelectionIndex % boardWidth
    let firstRow = Math.floor(firstSelectionIndex / boardWidth)

    let secondSelectionIndex = [...board.childNodes].indexOf(selected.secondSelection)
    let secondColumn = secondSelectionIndex % boardWidth
    let secondRow = Math.floor(secondSelectionIndex / boardWidth)


    // are they in the same diagonal?
    if ( shareDiagonal(firstColumn, firstRow, secondColumn, secondRow) ) {
        diagonalCellCheck({firstSelectionIndex, firstColumn, firstRow}, {secondSelectionIndex, secondColumn, secondRow})
        return
    }


    // are they in the same column?
    if (firstColumn === secondColumn) {
        columnCellCheck({firstSelectionIndex, firstRow}, {secondSelectionIndex, secondRow})
        return;
    }


    // will they eventually meet horizontally?
    horizontalCellCheck({firstSelectionIndex, firstRow}, {secondSelectionIndex, secondRow})


    clearSelected()
}

/**
 * Checks whether the two cells passed to it have no occupied/active cells
 * between them. This function assumes that the two cells are in a valid
 * diagonal to one another.
 * 
 * @param {{ firstSelectionIndex: number, firstColumn: number, firstRow: number}} firstSelectionParameters 
 * @param {{ secondSelectionIndex: number, secondColumn: number, secondRow: number}} secondSelectionParameters
 */
const diagonalCellCheck = ({firstSelectionIndex, firstColumn, firstRow}, {secondSelectionIndex, secondColumn, secondRow}) => {
    let smallerRow = Math.min(firstRow, secondRow)
    let largerRow = Math.max(firstRow, secondRow)

    let smallerColumn = Math.min(firstColumn, secondColumn)
    let largerColumn = Math.max(firstColumn, secondColumn)
    
    // checks whether the diagonal goes down to the right or the left
    let cellInMinCorner = cellInMinimumCorner(firstColumn, firstRow, secondColumn, secondRow)
    
    let currentIndex = firstRow === smallerRow ? firstSelectionIndex : secondSelectionIndex
    
    currentIndex += boardWidth + (cellInMinCorner ? 1 : -1)
    smallerColumn++


    let clear = true;
    while (smallerColumn < largerColumn) {
        if (boardNumbers[currentIndex] !== -1) {
            clear = false;
            break;
        }
        currentIndex += boardWidth + (cellInMinCorner ? 1 : -1)
        smallerColumn++
    }

    if (clear) {
        matched({firstSelectionIndex, firstRow}, {secondSelectionIndex, secondRow})
        addScore(15 * level)
    }
}

/**
 * Checks whether the two cells pass to this function have no active cells
 * between them. Assumes that the two cells are in the came column.
 * 
 * @param {{ firstSelectionIndex: number, firstRow: number}} firstSelectionParameters 
 * @param {{ secondSelectionIndex: number, secondRow: number}} secondSelectionParameters
 */
const columnCellCheck = ({firstSelectionIndex, firstRow}, {secondSelectionIndex, secondRow}) => {
    let smallerIndex = Math.min(firstSelectionIndex, secondSelectionIndex)
    let largerIndex = Math.max(firstSelectionIndex, secondSelectionIndex)

    let clear = true;
    for (let i = smallerIndex + boardWidth; i < largerIndex; i += boardWidth) {
        if (boardNumbers[i] !== -1) clear = false
    }

    if (clear) {
        matched({firstSelectionIndex, firstRow}, {secondSelectionIndex, secondRow})
        addScore(5 * level)
    }
}

/**
 * Checks whether the two cells passed to this function have no active cells between
 * them. The two cells do not have to be on the same row.
 * 
 * @param {{ firstSelectionIndex: number, firstRow: number}} firstSelectionParameters 
 * @param {{ secondSelectionIndex: number, secondRow: number}} secondSelectionParameters
 */
const horizontalCellCheck = ({firstSelectionIndex, firstRow}, {secondSelectionIndex, secondRow}) => {
    let smallerIndex = Math.min(firstSelectionIndex, secondSelectionIndex)
    let largerIndex = Math.max(firstSelectionIndex, secondSelectionIndex)

    let clear = true;
    for (let i = smallerIndex + 1; i < largerIndex; i++) {
        if (boardNumbers[i] !== -1) clear = false;
    }

    if (clear) {
        matched({firstSelectionIndex, firstRow}, {secondSelectionIndex, secondRow})
        addScore(2 * level)
    }
   
}


/**
 * When two cells are successfully matched together: deactivates the cells that were 
 * matched, removes them from the backend array, resets `selected`, and checks to see
 * if any rows need to be cleared from the board.
 * 
 * @param {{ firstSelectionIndex: number, firstRow: number}} firstSelectionParameters 
 * @param {{ secondSelectionIndex: number, secondRow: number}} secondSelectionParameters
 */
const matched = ({firstSelectionIndex, firstRow}, {secondSelectionIndex, secondRow}) => {
    boardNumbers[firstSelectionIndex] = -1
    boardNumbers[secondSelectionIndex] = -1

    selected.firstSelection.dataset.active = "false"
    selected.firstSelection.dataset.selected = "false"

    selected.secondSelection.dataset.active = "false"
    selected.secondSelection.dataset.selected = "false"

    clearSelected()
    
    let row1Cleared = attemptClearRow(firstRow)

    if (row1Cleared && secondRow >= firstRow) secondRow--;
    attemptClearRow(secondRow)
}


/**
 * Checks whether a row is entirely empty and should be cleared from the board.
 * If yes, then it clears that row.
 * 
 * @param {number} row The row number to attempt to clear
 * @returns {boolean} Whether the row was cleared
 */
const attemptClearRow = (row) => {
    const rowIndex = boardWidth * row;
    let willClear = true;

    for (let i = rowIndex; i < rowIndex + boardWidth && i < boardNumbers.length; i++) {
        if (boardNumbers[i] !== -1) {
            willClear = false;
            break;
        }
    }

    if (!willClear) return false;

    for (let i = rowIndex; i < rowIndex + boardWidth && i < boardNumbers.length; i++) {
        board.childNodes.item(rowIndex)?.remove()
    }
    boardNumbers.splice(rowIndex, boardWidth)
    
    addScore(10 * level)

    return true;
}



/**
 * Determins whether two points fall on the same diagonal line withing the board.
 * 
 * @param {number} x1 Column of cell 1 
 * @param {number} y1 Row of cell 1
 * @param {number} x2 Column of cell 2
 * @param {number} y2 Row of cell 2
 * @returns {boolean}
 */
const shareDiagonal = (x1, y1, x2, y2) => {
    let xDifference = Math.abs(x1 - x2)
    let yDifference = Math.abs(y1 - y2)

    // could they theoretically be diagonal ?
    // the distance on the X and Y axis must be the same for a valid diagonal
    if (xDifference !== yDifference) return false;
    
    let smallerX = Math.min(x1, x2)
    let largerX = Math.max(x1, x2)
    
    let smallerY = Math.min(y1, y2)
    let largerY = Math.max(y1, y2)
    
    const boardHeight = Math.floor(boardNumbers.length / boardWidth)

    // makes sure that the diagonal check doesn't wrap around to the other side
    // of the board
    while (smallerX <= boardWidth && smallerY <= boardHeight) {
        if (smallerX === largerX && smallerY === largerY) {
            return true;
        }
        smallerX++;
        smallerY++;
    }

    return false
}

/**
 * Determines whether the one of the two cells whose coordinates are given
 * is located in the corner such that both its X and Y coordinate are the
 * smallest out of the two points. (This is used to determine which direction 
 * diagonally up to check).
 * 
 * @param {number} x1 Column of cell 1 
 * @param {number} y1 Row of cell 1
 * @param {number} x2 Column of cell 2
 * @param {number} y2 Row of cell 2
 * @returns {boolean}
 */
const cellInMinimumCorner = (x1, y1, x2, y2) => {
    let xDifference = x1 - x2
    let yDifference = y1 - y2

    return (xDifference < 0 && yDifference < 0) || (xDifference > 0 && yDifference > 0)
}

resetBoard()