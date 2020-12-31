import { Board, Technique } from '../types'
import {
    allCandidates,
    allResults,
    candidatesExcept,
    difference,
    first,
    getAllHousesMinusFilledPoints,
    getBoardCell,
    getCombinations, getPointsWithCandidates,
    pointsEqual,
    removeCandidatesFromPoints,
    uniqueBy
} from '../utils'

function *nakedSubsetGenerator(board: Board, len: number){
    for(let points of getAllHousesMinusFilledPoints(board)){
        for(let candidates of getCombinations(allCandidates, len)){
            const pointsInside = points.filter(p => getBoardCell(board, p).candidates.every(c => candidates.includes(c)))
            if(pointsInside.length !== len) continue

            const pointsOutside = difference(points, pointsInside, pointsEqual)

            const effects = removeCandidatesFromPoints(board, pointsOutside, candidates)
            const actors = pointsInside.map(point => ({point}))

            if(effects.length > 0){
                yield {effects, actors}
            }
        }
    }
    return null
}

function *subsetGenerator(board: Board, len: number){
    const minInstanceEachCand = 2 // True for pair, triple, and quad. Just hardcode it.
    for(let points of getAllHousesMinusFilledPoints(board)){
        for(let candidates of getCombinations(allCandidates, len)){
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
            const actors = pointsInside.map(point => ({point}))

            if(effects.length > 0){
                yield {effects, actors}
            }
        }
    }
    return null
}

export const nakedPair: Technique = (board: Board) => first(nakedSubsetGenerator(board, 2))
export const allNakedPairs: Technique = (board: Board) => allResults(nakedSubsetGenerator(board, 2))

export const hiddenPair: Technique = (board: Board) => first(subsetGenerator(board, 2))
export const allHiddenPairs: Technique = (board: Board) => allResults(subsetGenerator(board, 2))

export const nakedTriple: Technique = (board: Board) => first(nakedSubsetGenerator(board, 3))
export const allNakedTriples: Technique = (board: Board) => allResults(nakedSubsetGenerator(board, 3))

export const hiddenTriple: Technique = (board: Board) => first(subsetGenerator(board, 3))
export const allHiddenTriples: Technique = (board: Board) => allResults(subsetGenerator(board, 3))

export const nakedQuad: Technique = (board: Board) => first(nakedSubsetGenerator(board, 4))
export const allNakedQuads: Technique = (board: Board) => allResults(nakedSubsetGenerator(board, 4))

export const hiddenQuad: Technique = (board: Board) => first(subsetGenerator(board, 4))
export const allHiddenQuads: Technique = (board: Board) => allResults(subsetGenerator(board, 4))