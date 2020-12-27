import { Point, Board, Effect, Field, EliminationEffect, NoneEffect, Actor } from './types'

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

export const getBoardField = (board: Board, point: Point) => board[point.y][point.x]

export const updateBoardField = (board: Board, point: Point, updates: Partial<Field>) => {
    board = [...board]
    board[point.y] = [...board[point.y]]
    board[point.y][point.x] = {...board[point.y][point.x], ...updates}
    return board
}

export const setCandidates = (board: Board, point: Point, candidates: number[]) => {
    return updateBoardField(board, point, {candidates})
}

export const removeCandidate = (board: Board, point: Point, number: number) => {
    const candidates = getBoardField(board, point).candidates
    const nextCandidates = candidates.filter(x => x !== number)
    if(nextCandidates.length === candidates.length){
        return {board, effect: {type: 'none'} as NoneEffect}
    }
    return {
        board: setCandidates(board, point, nextCandidates),
        effect: {type: 'elimination', point, numbers: [number]} as EliminationEffect
    }
}

export const removeCandidateFromAffectedPoints = (board: Board, point: Point, number: number) => {
    const effects: Effect[] = []
    getAffectedPoints(point)
        .forEach(affectedPoint => {
            const result = removeCandidate(board, affectedPoint, number)
            board = result.board
            if(result.effect.type !== 'none'){
                effects.push(result.effect)
            }
        })
    return {board, effects}
}

export const isBoardFinished = (board: Board) => {
    return getAllPoints().every(point => getBoardField(board, point).value !== null)
}

export const setAllSingleCandidates = (board: Board) => {
    const effects: Effect[] = []
    const actors: Actor[] = []
    getAllPoints().forEach(point => {
        const field = getBoardField(board, point)
        if(field.value === null && field.candidates.length === 1){
            const value = field.candidates[0]
            board = updateBoardField(board, point, {value})
            effects.push({type: 'value', point, number: value})
            actors.push({point})
        }
    })
    return {board, effects, actors}
}