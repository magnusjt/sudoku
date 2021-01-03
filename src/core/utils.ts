import { Point, Board, Effect, EliminationEffect, NoneEffect, Technique, Cell, AddCandidatesEffect } from './types'

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

export const getBoxX = (boxNumber: number) => (boxNumber % 3) * 3
export const getBoxY = (boxNumber: number) => Math.floor(boxNumber / 3) * 3

export const getAllBoxes = (): Point[][] => {
    const boxes: Point[][] = []
    for(let k = 0; k < 9; k++){
        const x = getBoxX(k)
        const y = getBoxY(k)
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

export const getRowsOutsideBox = boxNumber => {
    const boxY = getBoxY(boxNumber)
    return getAllRows().filter(points => points[0].y < boxY || points[0].y >= boxY + 3)
}
export const getColsOutsideBox = boxNumber => {
    const boxX = getBoxX(boxNumber)
    return getAllCols().filter(points => points[0].x < boxX || points[0].x >= boxX + 3)
}

// Finds every point which "sees" all of the given points
export const getAffectedPointsInCommon = (points: Point[]): Point[] => {
    return intersectionOfAll(points.map(getAffectedPoints), pointsEqual)
}

export const getRowNumber = (point: Point) => point.y
export const getColNumber = (point: Point) => point.x
export const getBoxNumber = (point: Point) => (Math.floor(point.x / 3)) + (3 * Math.floor(point.y/3))

export const getBoardCell = (board: Board, point: Point) => board[point.y][point.x]

export const removeCandidates = (board: Board, point: Point, numbers: number[]): Effect => {
    const cell = getBoardCell(board, point)
    const candidatesToRemove = cell.candidates.filter(x => numbers.includes(x))
    if(candidatesToRemove.length === 0 || cell.value !== null){
        return {type: 'none'} as NoneEffect
    }
    return {type: 'elimination', point, numbers: candidatesToRemove} as EliminationEffect
}

export const addCandidates = (board: Board, point: Point, numbers: number[]): Effect => {
    const cell = getBoardCell(board, point)
    const candidatesToAdd = numbers.filter(x => !cell.candidates.includes(x))
    if(candidatesToAdd.length === 0 || cell.value !== null){
        return {type: 'none'} as NoneEffect
    }
    return {type: 'addCandidates', point, numbers: candidatesToAdd} as AddCandidatesEffect
}

export const removeCandidatesFromPoints = (board: Board, points: Point[], numbers: number[]): Effect[] => {
    return points
        .map(point => removeCandidates(board, point, numbers))
        .filter(eff => eff.type !== 'none')
}

export const addCandidatesToPoints = (board: Board, points: Point[], numbers: number[]): Effect[] => {
    return points
        .map(point => addCandidates(board, point, numbers))
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

export const cloneBoard = (board: Board) => {
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
        if(effect.type === 'elimination') {
            board[effect.point.y][effect.point.x].candidates = board[effect.point.y][effect.point.x].candidates.filter(c => !effect.numbers.includes(c))
        }else if(effect.type === 'addCandidates'){
            board[effect.point.y][effect.point.x].candidates.push(...effect.numbers)
            board[effect.point.y][effect.point.x].candidates = unique(board[effect.point.y][effect.point.x].candidates)
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

export const getErrors = (board: Board) => {
    return getAllPoints().filter(point => pointHasError(board, point))
}

export const pointHasError = (board: Board, point: Point): boolean => {
    const cell = getBoardCell(board, point)
    if(cell.given) return false
    if(cell.value === null) return false
    return getAffectedPoints(point).some(p => getBoardCell(board, p).value === cell.value)
}

export const canPutDigit = (board: Board, point: Point, digit: number) => {
    const affected = getAffectedPoints(point)
    return !affected.some(p => getBoardCell(board, p).value === digit)
}