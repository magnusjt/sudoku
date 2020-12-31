import { Board, Point, Technique } from '../types'
import {
    allResults,
    difference,
    first,
    getAllUnfilledPoints,
    getBoardCell,
    getColNumber,
    getColumn,
    getCombinations,
    getRow,
    getRowNumber,
    groupBy,
    pointsEqual,
    removeCandidateFromPoints
} from '../utils'

function *fishGenerator(board: Board, len: number){
    const getFishResult = (fishPoints: Point[], getLineNumber, getLine, cand) => {
        const lines = Object.values<Point[]>(groupBy(fishPoints, getLineNumber))
        if(lines.length !== len) return null

        const pointsOnLines = lines.flatMap(points => getLine(getLineNumber(points[0])))
        const pointsToRemove = difference(pointsOnLines, fishPoints, pointsEqual)

        const effects = removeCandidateFromPoints(board, pointsToRemove, cand)
        const actors = fishPoints.map(point => ({point}))

        if(effects.length > 0){
            return {effects, actors}
        }
    }

    const minInstancesPerHouse = 2
    const allPoints = getAllUnfilledPoints(board)

    for(let cand = 1; cand <= 9; cand++){
        const pointsWithCand = allPoints.filter(p => getBoardCell(board, p).candidates.includes(cand))

        const rowsWithLen = Object.values<Point[]>(groupBy(pointsWithCand, getRowNumber))
            .filter(points => points.length >= minInstancesPerHouse && points.length <= len)

        for(let rows of getCombinations(rowsWithLen, len)){
            const result = getFishResult(rows.flat(), getColNumber, getColumn, cand)
            if(result) yield result
        }

        const colsWithLen = Object.values<Point[]>(groupBy(pointsWithCand, getColNumber))
            .filter(points => points.length >= minInstancesPerHouse && points.length <= len)

        for(let cols of getCombinations(colsWithLen, len)){
            const result = getFishResult(cols.flat(), getRowNumber, getRow, cand)
            if(result) yield result
        }
    }
    return null
}

/**
 * Looks like 4 corners of a rectangle, where either the rows or cols are empty otherwise.
 * Two columns has the same candidate in only two rows. The rest of the rows can be eliminated
 * Two rows has the same candidate in only two cols. The rest of the columns can be eliminated.
 */
export const xWing: Technique = (board: Board) => first(fishGenerator(board, 2))
export const allXWings: Technique = (board: Board) => allResults(fishGenerator(board, 2))

export const swordfish: Technique = (board: Board) => first(fishGenerator(board, 3))
export const allSwordfish: Technique = (board: Board) => allResults(fishGenerator(board, 3))

export const jellyfish: Technique = (board: Board) => first(fishGenerator(board, 4))
export const allJellyfish: Technique = (board: Board) => allResults(fishGenerator(board, 4))

// NB: Larger fish can always be decomposed into smaller fish, so no point looking