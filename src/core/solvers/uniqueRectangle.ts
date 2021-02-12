import { SolverBoard, Point } from '../types'
import {
    getAllRows,
    getBoardCell,
    getBoxNumber,
    getColumn, getPointId,
    getPointsWithNCandidates,
    pointsEqual
} from '../utils/sudokuUtils'
import { difference, groupBy, unique, uniqueBy } from '../utils/misc'
import { removeCandidatesFromPoints } from '../utils/effects'

const findNakedPairs = (board: SolverBoard, points: Point[]) => {
    const pairs: {points: Point[], candidates: number[]}[] = []
    const pointsWith2Cands = getPointsWithNCandidates(board, points, 2)

    for(let i = 0; i < pointsWith2Cands.length; i++){
        for(let j = i+1; j < pointsWith2Cands.length; j++){
            const pointsInside = [pointsWith2Cands[i], pointsWith2Cands[j]]
            const allCandidates = unique(pointsInside.flatMap(p => getBoardCell(board, p).candidates)) as number[]
            if(allCandidates.length !== 2) continue

            pairs.push({points: pointsInside, candidates: allCandidates})
        }
    }
    return pairs
}

/**
 * TODO: This can be written better. No need to look for all those pairs
 *
 * pairs of numbers in a rectangle shape cannot only contain those pairs.
 * Otherwise the sudoku can't be unique.
 * Only applies if there's only two boxes in play.
 *
 * Type 1: 3 corners with two possible candidates. We can eliminate those candidates from the fourth corner
 * (any value that would "resolve" the uniqueness would either make the 3 corners have 0 candidates, or itself eliminate the 4 corner candidates like we would otherwise)
 * TODO: Type 2: 1 extra candidate in two cells that are not diagonals. This will then create a pointer, since the candidate must be in either of those cells.
 * TODO: Type 3: Same as type 2, but more candidates. Treat the cells of the rectangle as one virtual cell, and look for naked pair/triple/quad.
 * TODO: Type 4: Same as type 3, but this time check if one of the rectangle candidates are only in the rectangle cells in that box/column/row. If so, delete the other rectangle candidate.
 * TODO: Type 5: Same as type 2, but the extra candidate is on a diagonal. The candidate must be in one of these. See if there are cells that sees both of these, and eliminate the cand from those.
 * TODO: Type 6: See if one of the rectangle candidates form an x-wing. If so, it must be placed on two points diagonally. If this removes all other candidates from the rectangle, it is invalid, and so can be eliminated.
 * TODO: Hidden, avoidable 1/2, BUG, missing candidates. These seem a bit too exotic tbh.
 */
export const uniqueRectangle1 = (board: SolverBoard) => {
    for(let points of getAllRows()){
        const pairs = findNakedPairs(board, points)
        for(let pair of pairs){
            const colPairs = [
                ...findNakedPairs(board, getColumn(pair.points[0].x)),
                ...findNakedPairs(board, getColumn(pair.points[1].x))
            ]

            const matchingPairs = colPairs
                .filter(colPair => unique([...colPair.candidates, ...pair.candidates]).length === 2) // Has the same two candidates
                .filter(colPair => difference(pair.points, colPair.points, pointsEqual).length === 1) // Shares one point
                .filter(colPair => unique([...colPair.points, ...pair.points].map(getBoxNumber)).length === 2) // In exactly two boxes

            for(let colPair of matchingPairs){
                const corners = uniqueBy([...colPair.points, ...pair.points], pointsEqual)
                const x = Object.values<any>(groupBy(corners, p => p.x)).filter(xs => xs.length === 1).map(xs => xs[0])[0].x
                const y = Object.values<any>(groupBy(corners, p => p.y)).filter(ys => ys.length === 1).map(ys => ys[0])[0].y
                const missingCorner = {
                    x, y, id: getPointId(x, y)
                }
                const candidates = pair.candidates
                const effects = removeCandidatesFromPoints(board, [missingCorner], candidates)
                const actors = corners.map(point => ({point}))

                if(effects.length > 0){
                    return {effects, actors}
                }
            }
        }
    }

    return null
}
