import { Point, Board, Effect, EliminationEffect, NoneEffect, Technique, Cell } from './types'

export const getCombinations = <T>(items: T[], len: number, initIndex = 0): T[][] => {
    if(len === 0) return []
    const combos: T[][] = []
    // NB: Stop loop before it gets so far as to not have enough items left for a full combo
    for(let i = initIndex; i < items.length-len+1; i++){
        const rest = getCombinations(items, len - 1, i + 1)
        if(rest.length === 0){
            combos.push([items[i]])
        }
        for(let combo of rest){
            combos.push([items[i], ...combo])
        }
    }
    return combos
}

export const first = <T>(iterable: Iterable<T>) => iterable[Symbol.iterator]().next().value
export const allResults = (iterable: Iterable<ReturnType<Technique>>) => {
    return Array.from(iterable)
        .reduce<ReturnType<Technique>>((allResults, result) => {
            if(result === null) return allResults
            if(allResults === null){
                allResults = {effects: [], actors: []}
            }
            allResults.effects.push(...result.effects)
            allResults.actors.push(...result.actors)
            return allResults
        }, null)
}

export const unique = <T>(arr: T[]): T[] => [...new Set(arr)]
export const uniqueBy = <T>(arr: T[], isEqual): T[] => {
    const result: T[] = []
    arr.forEach(a => {
        if(!result.some(b => isEqual(a, b))){
            result.push(a)
        }
    })
    return result
}
export const difference = <T>(arr1: T[], arr2: T[], isEqual): T[] => {
    return arr1.filter(a => !arr2.some(b => isEqual(a, b)))
}
export const intersection = <T>(arr1: T[], arr2: T[], isEqual): T[] => {
    return uniqueBy([...arr1, ...arr2], isEqual).filter(x => arr1.some(a => isEqual(a, x) && arr2.some(a => isEqual(a, x))))
}
export const intersectionOfAll = <T>(arr: T[][], isEqual): T[] => {
    return uniqueBy(arr.flat(), isEqual).filter(x => arr.every(subArr => subArr.some(a => isEqual(a, x))))
}
export const arraysEqual = (arr1, arr2, isEqual) => {
    return arr1.length === arr2.length && arr1.every((a, i) => isEqual(a, arr2[i]))
}
type Groups<T> = {[key: string]: T[]}
export const groupBy = <T>(arr: T[], by): Groups<T> => {
    return arr.reduce((groups, item) => {
        const key = by(item)
        groups[key] = (groups[key] ?? [])
        groups[key].push(item)
        return groups
    }, {})
}

export const pointsEqual = (pointA: Point, pointB: Point) => pointA.x === pointB.x && pointA.y === pointB.y
export const pointListsEqual = (pointsA: Point[], pointsB: Point[]) => arraysEqual(pointsA, pointsB, pointsEqual)

export const allCandidates = Array(9).fill(0).map((_, i) => i + 1)

export const candidatesExcept = (cands: number[]) => difference(allCandidates, cands, (a,b) => a === b)

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

export const getAllUnfilledPoints = (board: Board): Point[] => getAllPoints().filter(p => getBoardCell(board, p).value === null)

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

export const getAllHouses = (): Point[][] => {
    return [
        ...getAllRows(),
        ...getAllCols(),
        ...getAllBoxes()
    ]
}

export const getAllHousesMinusFilledPoints = (board: Board): Point[][] => getAllHouses()
    .map(points => points.filter(p => getBoardCell(board, p).value === null))
    .filter(points => points.length > 0)

export const getAffectedPoints = (point: Point): Point[] => {
    return [
        ...getColumn(point.x),
        ...getRow(point.y),
        ...getBox(point)
    ].filter(p => !pointsEqual(p, point))
}

// Finds every point which "sees" all of the given points
export const getAffectedPointsInCommon = (points: Point[]): Point[] => {
    return intersectionOfAll(points.map(getAffectedPoints), pointsEqual)
}

export const getRowNumber = (point: Point) => point.y
export const getColNumber = (point: Point) => point.x
export const getBoxNumber = (point: Point) => (1 + Math.floor(point.x / 3)) * (1 + Math.floor(point.y/3)) - 1

export const getBoardCell = (board: Board, point: Point) => board[point.y][point.x]

export const removeCandidates = (board: Board, point: Point, numbers: number[]): Effect => {
    const candidatesToRemove = getBoardCell(board, point).candidates.filter(x => numbers.includes(x))
    if(candidatesToRemove.length === 0){
        return {type: 'none'} as NoneEffect
    }
    return {type: 'elimination', point, numbers: candidatesToRemove} as EliminationEffect
}

export const removeCandidate = (board: Board, point: Point, number: number): Effect => {
    return removeCandidates(board, point, [number])
}

export const removeCandidatesFromPoints = (board: Board, points: Point[], numbers: number[]): Effect[] => {
    return points
        .map(point => removeCandidates(board, point, numbers))
        .filter(eff => eff.type !== 'none')
}

export const removeCandidateFromPoints = (board: Board, points: Point[], number: number): Effect[] => {
    return removeCandidatesFromPoints(board, points, [number])
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

export const pointsWhere = (board: Board, points: Point[], filter: (cell: Cell) => boolean): Point[] =>
    points.filter(point => filter(getBoardCell(board, point)))

export const getPointsWithCandidates = (board: Board, points: Point[], cands: number[]) =>
    pointsWhere(board, points, (cell) => cands.every(cand => cell.candidates.includes(cand)))

export const getPointsWithNCandidates = (board: Board, points: Point[], n: number) =>
    pointsWhere(board, points, (cell) => cell.candidates.length === n)