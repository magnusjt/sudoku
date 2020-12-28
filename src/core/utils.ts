import { Point, Board, Effect, Field, EliminationEffect, NoneEffect, Actor } from './types'

export const unique = arr => [...new Set(arr)]
export const difference = (arr1, arr2, isEqual) => {
    return arr1.filter(a => !arr2.some(b => isEqual(a, b)))
}

export const pointsEqual = (pointA: Point, pointB: Point) => pointA.x === pointB.x && pointA.y === pointB.y

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

export const getAllClosedRegions = (): Point[][] => {
    const regions: Point[][] = []
    for(let y = 0; y < 9; y++){
        regions.push(getRow(y))
    }
    for(let x = 0; x < 9; x++){
        regions.push(getColumn(x))
    }
    for(let k = 0; k < 9; k++){
        const x = (k % 3) * 3
        const y = Math.floor(k / 3) * 3
        regions.push(getBox({x, y}))
    }
    return regions
}

export const getAffectedPoints = (point: Point): Point[] => {
    return [
        ...getColumn(point.x),
        ...getRow(point.y),
        ...getBox(point)
    ].filter(p => !pointsEqual(p, point))
}

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