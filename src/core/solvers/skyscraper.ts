import { SolverBoard, Point } from '../types'
import { allResults, difference, first, getCombinations, groupBy } from '../utils/misc'
import {
    getAffectedPointsInCommon,
    getAllUnfilledPoints, getColNumber,
    getPointsWithCandidates, getRowNumber,
    pointsEqual
} from '../utils/sudokuUtils'
import { removeCandidateFromPoints } from '../utils/effects'

/**
 * Basically an x-wing where one candidate is not aligned.
 * The line (row or col) where the points are aligned force the candidate to be placed in one of the other two points.
 * All other cells that sees these two candidates can be eliminated.
 */
function *skyscraperGenerator(board: SolverBoard){
    const getSkyscraperResult = (skyscraperPoints: Point[], getLineNumber, cand: number) => {
        const pointsOnLine = Object.values<Point[]>(groupBy(skyscraperPoints, getLineNumber)).filter(points => points.length === 2)[0]
        if(!pointsOnLine) return null

        const pointsToCheck = difference(skyscraperPoints, pointsOnLine, pointsEqual)
        const affectedInCommon = getAffectedPointsInCommon(pointsToCheck)
        const pointsToRemove = difference(affectedInCommon, skyscraperPoints, pointsEqual)

        const effects = removeCandidateFromPoints(board, pointsToRemove, cand)
        const actors = skyscraperPoints.map(point => ({point, cand}))

        if(effects.length > 0){
            return {effects, actors}
        }
        return null
    }

    const allPoints = getAllUnfilledPoints(board)

    for(let cand = 1; cand <= 9; cand++){
        const pointsWithCand = getPointsWithCandidates(board, allPoints, [cand])

        const rowsWithTwo = Object.values<Point[]>(groupBy(pointsWithCand, getRowNumber)).filter(points => points.length === 2)

        for(let rows of getCombinations(rowsWithTwo, 2)){
            const result = getSkyscraperResult(rows.flat(), getColNumber, cand)
            if(result) yield result
        }

        const colsWithTwo = Object.values<Point[]>(groupBy(pointsWithCand, getColNumber)).filter(points => points.length === 2)

        for(let cols of getCombinations(colsWithTwo, 2)){
            const result = getSkyscraperResult(cols.flat(), getRowNumber, cand)
            if(result) yield result
        }
    }
    return null
}

export const skyscraper = (board: SolverBoard) => first(skyscraperGenerator(board))
export const allSkyscrapers = (board: SolverBoard) => allResults(skyscraperGenerator(board))