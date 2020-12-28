import { Point, Board, Effect, EliminationEffect, NoneEffect } from './types'

export const unique = arr => [...new Set(arr)]
export const uniqueBy = (arr, isEqual) => {
    const result: any[] = []
    arr.forEach(a => {
        if(!result.some(b => isEqual(a, b))){
            result.push(a)
        }
    })
    return arr
}
export const difference = (arr1, arr2, isEqual) => {
    return arr1.filter(a => !arr2.some(b => isEqual(a, b)))
}
export const arraysEqual = (arr1, arr2, isEqual) => {
    return arr1.length === arr2.length && arr1.every((a, i) => isEqual(a, arr2[i]))
}

export const pointsEqual = (pointA: Point, pointB: Point) => pointA.x === pointB.x && pointA.y === pointB.y
export const pointListsEqual = (pointsA: Point[], pointsB: Point[]) => arraysEqual(pointsA, pointsB, pointsEqual)

let allPoints
export const getAllPoints = (): Point[] => {
    if(allPoints) return allPoints
    const points: Point[] = []
    for(let x = 0; x < 9; x++){
        for(let y = 0; y < 9; y++){
            points.push({x, y})
        }
    }
    allPoints = points
    return points
}

export const getColumn = (x: number): Point[] => {
    const col: Point[] = []
    for(let y = 0; y < 9; y++){
        col.push({x, y})
    }
    return col
}
export const getRow = (y: number): Point[] => {
    const row: Point[] = []
    for(let x = 0; x < 9; x++){
        row.push({x, y})
    }
    return row
}
export const getBox = (point: Point): Point[] => {
    const box: Point[] = []
    const xStart = Math.floor(point.x/3)*3
    const yStart = Math.floor(point.y/3)*3
    for(let x = xStart; x < xStart + 3; x++){
        for(let y = yStart; y < yStart + 3; y++){
            box.push({x, y})
        }
    }
    return box
}
export const getAllRows = (): Point[][] => {
    const rows: Point[][] = []
    for(let y = 0; y < 9; y++){
        rows.push(getRow(y))
    }
    return rows
}

export const getAllCols = (): Point[][] => {
    const cols: Point[][] = []
    for(let x = 0; x < 9; x++){
        cols.push(getColumn(x))
    }
    return cols
}

export const getAllBoxes = (): Point[][] => {
    const boxes: Point[][] = []
    for(let k = 0; k < 9; k++){
        const x = (k % 3) * 3
        const y = Math.floor(k / 3) * 3
        boxes.push(getBox({x, y}))
    }
    return boxes
}

export const getAllClosedRegions = (): Point[][] => {
    return [
        ...getAllRows(),
        ...getAllCols(),
        ...getAllBoxes()
    ]
}

export const getAffectedPoints = (point: Point): Point[] => {
    return [
        ...getColumn(point.x),
        ...getRow(point.y),
        ...getBox(point)
    ].filter(p => !pointsEqual(p, point))
}

export const getRowNumber = (point: Point) => point.y
export const getColNumber = (point: Point) => point.x
export const getBoxNumber = (point: Point) => (1 + Math.floor(point.x / 3)) * (1 + Math.floor(point.y/3)) - 1

export const getBoardCell = (board: Board, point: Point) => board[point.y][point.x]

export const removeCandidate = (board: Board, point: Point, number: number): Effect => {
    const candidates = getBoardCell(board, point).candidates
    const nextCandidates = candidates.filter(x => x !== number)
    if(nextCandidates.length === candidates.length){
        return {type: 'none'} as NoneEffect
    }
    return {type: 'elimination', point, numbers: [number]} as EliminationEffect
}

export const removeCandidateFromPoints = (board: Board, points: Point[], number: number): Effect[] => {
    return points
        .map(point => removeCandidate(board, point, number))
        .filter(eff => eff.type !== 'none')
}

export const removeCandidateFromAffectedPoints = (board: Board, point: Point, number: number): Effect[] => {
    return removeCandidateFromPoints(board, getAffectedPoints(point), number)
}

export const isBoardFinished = (board: Board) => {
    return getAllPoints().every(point => getBoardCell(board, point).value !== null)
}

const cloneBoard = (board: Board) => {
    return [...board].map(row => [...row].map(cell => {
        return {
            ...cell,
            candidates: [...cell.candidates]
        }
    }))
}

export const applyEffects = (board: Board, effects: Effect[]) => {
    board = cloneBoard(board)

    effects.forEach(effect => {
        if(effect.type === 'elimination'){
            board[effect.point.y][effect.point.x].candidates = board[effect.point.y][effect.point.x].candidates.filter(c => !effect.numbers.includes(c))
        }else if(effect.type === 'value'){
            board[effect.point.y][effect.point.x].value = effect.number
            board[effect.point.y][effect.point.x].candidates = []
        }
    })

    return board
}

export const candidatesEqual = (a: number[], b: number[]) => arraysEqual(a, b, (a, b) => a === b)