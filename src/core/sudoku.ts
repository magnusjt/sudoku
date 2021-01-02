import { Board, Cell, InputMode, Point, Technique } from './types'
import { allCandidates, applyEffects, cloneBoard, getAllPoints, getBoardCell, isBoardFinished } from './utils'
import { allBasicEliminations, basicElimination } from './solvers/basic'
import { hiddenSingle, nakedSingle } from './solvers/singles'
import { inversePointer, pointer } from './solvers/pointer'
import { hiddenPair, hiddenQuad, hiddenTriple, nakedPair, nakedQuad, nakedTriple } from './solvers/subset'
import { jellyfish, swordfish, xWing } from './solvers/fish'
import { skyscraper } from './solvers/skyscraper'
import { uniqueRectangle } from './solvers/uniqueRectangle'
import { xyWing, xyzWing } from './solvers/wing'
import { emptyRectangle } from './solvers/emptyRectangle'

export const boardFromInput = (input: number[][], withCandidates = true) => {
    const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    let board: Board = []
    for(let y = 0; y < 9; y++){
        let row: Cell[] = []
        for(let x = 0; x < 9; x++){
            if(input[y][x] !== 0){
                row.push({
                    value: input[y][x],
                    given: true,
                    candidates: []
                })
            }else{
                row.push({
                    value: null,
                    given: false,
                    candidates: withCandidates ? candidates : []
                })
            }
        }
        board.push(row)
    }
    return board
}
export const resetCandidates = (board: Board) => {
    board = cloneBoard(board)
    for(let point of getAllPoints()){
        board[point.y][point.x].candidates = board[point.y][point.x].value === null ? allCandidates : []
    }
    return board
}

export const techniques: {type: string, fn: Technique}[] = [
    {type: 'basic', fn: basicElimination},
    {type: 'nakedSingle', fn: nakedSingle},
    {type: 'hiddenSingle', fn: hiddenSingle},
    {type: 'pointer', fn: pointer},
    {type: 'inversePointer', fn: inversePointer},
    {type: 'nakedPair', fn: nakedPair},
    {type: 'nakedTriple', fn: nakedTriple},
    {type: 'nakedQuad', fn: nakedQuad},
    {type: 'hiddenPair', fn: hiddenPair},
    {type: 'hiddenTriple', fn: hiddenTriple},
    {type: 'hiddenQuad', fn: hiddenQuad},
    {type: 'xwing', fn: xWing},
    {type: 'uniqueRectangle', fn: uniqueRectangle},
    {type: 'skyscraper', fn: skyscraper},
    {type: 'emptyRectangle', fn: emptyRectangle},
    {type: 'xywing', fn: xyWing},
    {type: 'xyzwing', fn: xyzWing},
    {type: 'swordfish', fn: swordfish},
    {type: 'jellyfish', fn: jellyfish},
]

export const runTechnique = (board) => {
    for(let technique of techniques){
        const result = technique.fn(board)
        if(result){
            return {
                ...result,
                technique: technique.type
            }
        }
    }

    return null
}

export const applyTechniques = (board: Board, techniqueTypes: string[]) => {
    while(true){
        if(isBoardFinished(board)){
            return board
        }
        let moreToGo = false
        for(let techType of techniqueTypes){
            const tech = techniques.find(t => t.type === techType)
            if(!tech) throw new Error('Unknown technique type')
            const res = tech.fn(board)
            if(res){
                board = applyEffects(board, res.effects)
                moreToGo = true
            }
        }
        if(!moreToGo){
            return board
        }
    }
}

export const runBasicEliminations = (board) => {
    const res = allBasicEliminations(board)
    if(res){
        board = applyEffects(board, res.effects)
    }
    return board
}

export const iterate = (board) => {
    const result = runTechnique(board)
    if(result){
        board = applyEffects(board, result.effects)
        return {board, ...result}
    }

    if(isBoardFinished(board)){
        return {board, effects: [], actors: [], technique: 'done'}
    }

    return {board, effects: [], actors: [], technique: 'wtf'}
}

export const applyInputValue = (board: Board, points: Point[], digit: number, mode: InputMode) => {
    board = cloneBoard(board)

    if(points.length === 1){
        const point = points[0]
        const cell = getBoardCell(board, point)
        if(mode === 'candidates' && cell.value === null){
            if(cell.candidates.includes(digit)){
                cell.candidates = cell.candidates.filter(c => c !== digit)
            }else{
                cell.candidates.push(digit)
            }
        }else if(mode === 'normal' && !cell.given){
            if(cell.value === digit){
                cell.value = null
            }else{
                cell.value = digit
            }
        }
    }else if(points.length >= 2){
        points.forEach(point => {
            const cell = getBoardCell(board, point)
            if(cell.value === null){
                if(cell.candidates.includes(digit)){
                    cell.candidates = cell.candidates.filter(c => c !== digit)
                }else{
                    cell.candidates.push(digit)
                }
            }
        })
    }

    return board
}