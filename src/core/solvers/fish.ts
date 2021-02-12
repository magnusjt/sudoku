import { Point, SolverBoard } from '../types'
import { allResults, difference, first, getCombinations, groupBy } from '../utils/misc'
import {
    getAllUnfilledPoints, getColNumber,
    getColumn,
    getPointsWithCandidates, getRow,
    getRowNumber,
    pointsEqual
} from '../utils/sudokuUtils'
import { removeCandidateFromPoints } from '../utils/effects'

function *fishGenerator(board: SolverBoard, len: number){
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
        const pointsWithCand = getPointsWithCandidates(board, allPoints, [cand])

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
export const xWing = (board: SolverBoard) => first(fishGenerator(board, 2))
export const allXWings = (board: SolverBoard) => allResults(fishGenerator(board, 2))

export const swordfish = (board: SolverBoard) => first(fishGenerator(board, 3))
export const allSwordfish = (board: SolverBoard) => allResults(fishGenerator(board, 3))

export const jellyfish = (board: SolverBoard) => first(fishGenerator(board, 4))
export const allJellyfish = (board: SolverBoard) => allResults(fishGenerator(board, 4))

// NB: Larger fish can always be decomposed into smaller fish, so no point looking