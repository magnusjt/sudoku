import { Point, Board, Cell } from '../types'
import { arraysEqual, difference, intersectionOfAll, memoize } from './misc'

export const pointsEqual = (pointA: Point, pointB: Point) => pointA.x === pointB.x && pointA.y === pointB.y
export const pointListsEqual = (pointsA: Point[], pointsB: Point[]) => arraysEqual(pointsA, pointsB, pointsEqual)

export const allCandidates = Array(9).fill(0).map((_, i) => i + 1)

export const candidatesExcept = (cands: number[]) => difference(allCandidates, cands, (a,b) => a === b)

export const getAllPoints = memoize((): Point[] => {
    const points: Point[] = []
    for(let x = 0; x < 9; x++){
        for(let y = 0; y < 9; y++){
            points.push({x, y})
        }
    }
    return points
}, () => '')

export const getAllUnfilledPoints = (board: Board): Point[] => getAllPoints().filter(p => getBoardCell(board, p).value === null)

export const getColumn = memoize((x: number): Point[] => {
    const col: Point[] = []
    for(let y = 0; y < 9; y++){
        col.push({x, y})
    }
    return col
}, (x) => x)

export const getRow = memoize((y: number): Point[] => {
    const row: Point[] = []
    for(let x = 0; x < 9; x++){
        row.push({x, y})
    }
    return row
}, y => y)

export const getBox = memoize((point: Point): Point[] => {
    const box: Point[] = []
    const xStart = Math.floor(point.x/3)*3
    const yStart = Math.floor(point.y/3)*3
    for(let x = xStart; x < xStart + 3; x++){
        for(let y = yStart; y < yStart + 3; y++){
            box.push({x, y})
        }
    }
    return box
}, p => `${p.x}-${p.y}`)

export const getAllRows = memoize((): Point[][] => {
    const rows: Point[][] = []
    for(let y = 0; y < 9; y++){
        rows.push(getRow(y))
    }
    return rows
}, () => 'T')

export const getAllCols = memoize((): Point[][] => {
    const cols: Point[][] = []
    for(let x = 0; x < 9; x++){
        cols.push(getColumn(x))
    }
    return cols
}, () => 'T')

export const getBoxX = (boxNumber: number) => (boxNumber % 3) * 3
export const getBoxY = (boxNumber: number) => Math.floor(boxNumber / 3) * 3

export const getAllBoxes = memoize((): Point[][] => {
    const boxes: Point[][] = []
    for(let k = 0; k < 9; k++){
        const x = getBoxX(k)
        const y = getBoxY(k)
        boxes.push(getBox({x, y}))
    }
    return boxes
}, () => 'T')

export const getAllHouses = memoize((): Point[][] => {
    return [
        ...getAllRows(),
        ...getAllCols(),
        ...getAllBoxes()
    ]
}, () => 'T')

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

export const pointsWhere = (board: Board, points: Point[], filter: (cell: Cell) => boolean): Point[] =>
    points.filter(point => filter(getBoardCell(board, point)))

export const getPointsWithCandidates = (board: Board, points: Point[], cands: number[]) =>
    pointsWhere(board, points, (cell) => cands.every(cand => cell.candidates.includes(cand)))

export const getPointsWithNCandidates = (board: Board, points: Point[], n: number) =>
    pointsWhere(board, points, (cell) => cell.candidates.length === n)

export const canPutDigit = (board: Board, point: Point, digit: number) => {
    const affected = getAffectedPoints(point)
    return !affected.some(p => getBoardCell(board, p).value === digit)
}

export const boardHasError = (board: Board, solution: Board) => {
    return !getAllPoints().every(point => {
        const value = getBoardCell(board, point).value
        return value === null || getBoardCell(solution, point).value === value
    })
}

export const boardIsComplete = (board: Board) => {
    return getAllPoints().every(point => getBoardCell(board, point).value !== null)
}