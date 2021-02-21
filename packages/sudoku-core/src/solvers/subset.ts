import { SolverBoard } from '../types'
import {
    allCandidates, candidatesExcept,
    getAllHousesMinusFilledPoints,
    getBoardCell,
    getPointsWithCandidates,
    pointsEqual
} from '../utils/sudokuUtils'
import { allResults, difference, first, getCombinations, uniqueBy } from '../utils/misc'
import { removeCandidatesFromPoints } from '../utils/effects'

function *nakedSubsetGenerator(board: SolverBoard, len: number){
    for(const points of getAllHousesMinusFilledPoints(board)){
        for(const candidates of getCombinations(allCandidates, len)){
            const pointsInside = points.filter(p => getBoardCell(board, p).candidates.every(c => candidates.includes(c)))
            if(pointsInside.length !== len) continue

            const pointsOutside = difference(points, pointsInside, pointsEqual)

            const effects = removeCandidatesFromPoints(board, pointsOutside, candidates)
            const actors = pointsInside.flatMap(point => candidates.map(cand => ({ point, cand })))

            if(effects.length > 0){
                yield {effects, actors}
            }
        }
    }
    return null
}

function *subsetGenerator(board: SolverBoard, len: number){
    const minInstanceEachCand = 2 // True for pair, triple, and quad. Just hardcode it.
    for(const points of getAllHousesMinusFilledPoints(board)){
        for(const candidates of getCombinations(allCandidates, len)){
            const subsetPointLists = candidates.map(cand => getPointsWithCandidates(board, points, [cand]))
            const everyCandIsRepresented = subsetPointLists.every(points => points.length >= minInstanceEachCand && points.length <= len)
            if(!everyCandIsRepresented) continue

            const pointsInside = uniqueBy(subsetPointLists.flat(), pointsEqual)
            if(pointsInside.length !== len) continue

            const pointsOutside = difference(points, pointsInside, pointsEqual)

            const effects = [
                ...removeCandidatesFromPoints(board, pointsOutside, candidates),
                ...removeCandidatesFromPoints(board, pointsInside, candidatesExcept(candidates))
            ]
            const actors = pointsInside.flatMap(point => candidates.map(cand => ({ point, cand })))

            if(effects.length > 0){
                yield {effects, actors}
            }
        }
    }
    return null
}

export const nakedPair = (board: SolverBoard) => first(nakedSubsetGenerator(board, 2))
export const allNakedPairs = (board: SolverBoard) => allResults(nakedSubsetGenerator(board, 2))

export const hiddenPair = (board: SolverBoard) => first(subsetGenerator(board, 2))
export const allHiddenPairs = (board: SolverBoard) => allResults(subsetGenerator(board, 2))

export const nakedTriple = (board: SolverBoard) => first(nakedSubsetGenerator(board, 3))
export const allNakedTriples = (board: SolverBoard) => allResults(nakedSubsetGenerator(board, 3))

export const hiddenTriple = (board: SolverBoard) => first(subsetGenerator(board, 3))
export const allHiddenTriples = (board: SolverBoard) => allResults(subsetGenerator(board, 3))

export const nakedQuad = (board: SolverBoard) => first(nakedSubsetGenerator(board, 4))
export const allNakedQuads = (board: SolverBoard) => allResults(nakedSubsetGenerator(board, 4))

export const hiddenQuad = (board: SolverBoard) => first(subsetGenerator(board, 4))
export const allHiddenQuads = (board: SolverBoard) => allResults(subsetGenerator(board, 4))