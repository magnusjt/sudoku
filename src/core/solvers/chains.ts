import { Point, SolverBoard, Technique } from '../types'
import { removeCandidateFromPoints, removeCandidatesFromPoints } from '../utils/effects'
import { allResults, first, getCombinations, intersection } from '../utils/misc'
import {
    allCandidates,
    getAffectedPoints, getAffectedPointsInCommon,
    getAllPoints,
    getBoardCell, getPointsWithCandidates,
    getPointsWithNCandidates,
    pointsEqual
} from '../utils/sudokuUtils'

const getPointKey = (point: Point) => `${point.y}-${point.x}`

type Graph = {
    [key: string]: {
        point: Point
        connected: Point[]
    }
}

/**
 * Create a graph with all connected points.
 * Only include the given points in the graph.
 */
const buildGraph = (allowedPoints: Point[], isLinked: (a: Point, b: Point) => boolean) => {
    const graph = {}

    const build = (point) => {
        const key = getPointKey(point)
        if(graph[key]) return

        const connected = intersection(getAffectedPoints(point), allowedPoints, pointsEqual)
            .filter(p => isLinked(point, p))
        graph[key] = {point, connected}

        connected.forEach(build)
    }

    allowedPoints.forEach(build)
    return graph
}

/**
 * Creates all possible chains from a graph. This might explode, but let's see...
 */
const getChains = (graph: Graph) => {
    const getChainsStartingFromPoint = (point: Point, seen) => {
        const key = getPointKey(point)
        if(seen.has(key)) return [[]] // Return one empty chain. This makes it easier to handle the case where we are at the last point in a chain.
        seen.add(key)

        const connected = graph[key].connected
        const chains: Point[][] = []
        for(let point2 of connected){
            for(let chain of getChainsStartingFromPoint(point2, seen)){
                chains.push([point, ...chain])
            }
        }
        return chains
    }

    const chains: Point[][] = []
    for(let {point} of Object.values(graph)){
        const subChains = getChainsStartingFromPoint(point, new Set())
        chains.push(...subChains)
    }
    return chains
}

/**
 * Remote pairs are a chain of cells with the same two candidates, like a pair but at least 4 cells,
 * each affecting the next. E.g.
 * 45 45 45 45
 * Can be either
 *
 * 4  5  4  5
 * 5  4  5  4
 *
 * So if any cells in the chain length 3+2n apart has cells they see in common, we can eliminate the pair candidates from the cells in common.
 * Just like a normal naked pair actually, but with more steps.
 */
function *remotePairChainGenerator(board: SolverBoard){
    const biValuePoints = getPointsWithNCandidates(board, getAllPoints(), 2)

    for(let cands of getCombinations(allCandidates, 2)){
        const points = getPointsWithCandidates(board, biValuePoints, cands)
        if(points.length < 4) continue

        const graph = buildGraph(points, () => true)
        const chains = getChains(graph)
            .filter(x => x.length >= 4)
            .sort((a, b) => a.length - b.length)

        for(let chain of chains){
            for(let i = 0; i < chain.length; i++){
                for(let j = i + 3; j < chain.length; j += 2){
                    const point1 = chain[i]
                    const point2 = chain[j]
                    const affected = getAffectedPointsInCommon([point1, point2])
                    const cands = getBoardCell(board, point1).candidates
                    const effects = removeCandidatesFromPoints(board, affected, cands)
                    const actors = chain.slice(i, j + 1).map(point => ({point}))
                    if(effects.length > 0){
                        yield {effects, actors}
                    }
                }
            }
        }
    }

    return null
}

const candidatesEqual = (a, b) => a === b

/**
 * xy chain are cells with only two candidates in them, weakly linked.
 * The two ends of the chain share a candidate
 * The other two candidates, if set, must lead to the other end of the chain being the shared candidate
 * Any cells that see both ends of the chain can eliminate the shared candidate
 */
function *xyChainGenerator(board: SolverBoard){
    const biValuePoints = getPointsWithNCandidates(board, getAllPoints(), 2)

    // Checks if a canditate set in first cell leads to the ending candidate in the last cell
    // Assumes that there are only two candidates in each cell in the chain
    const isWeakLinkedChainStartingWithCand = (chain: Point[], cand: number, endingCand: number) => {
        for(let i = 0; i < chain.length - 1; i++){
            const cell1 = getBoardCell(board, chain[i])
            const cell2 = getBoardCell(board, chain[i + 1])
            const isInBoth = cell1.candidates.includes(cand) && cell2.candidates.includes(cand)
            if(!isInBoth) return false

            // eslint-disable-next-line no-loop-func
            cand = cell2.candidates.filter(c => c !== cand)[0]
        }
        return cand === endingCand
    }

    // Build graph where cells are linked if they have at least one cand in common.
    // This doesn't ensure the xy chain, but limits the number of chains a bit
    const graph = buildGraph(biValuePoints, (point1, point2) => {
        const cell1 = getBoardCell(board, point1)
        const cell2 = getBoardCell(board, point2)

        const commonCands = intersection(cell1.candidates, cell2.candidates, candidatesEqual)
        return commonCands.length > 0
    })

    const chains = getChains(graph)
        .filter(chain => chain.length >= 3)
        .sort((a, b) => a.length - b.length)

    for(let chain of chains){
        for(let i = 0; i < chain.length; i++){
            for(let j = i + 2; j < chain.length; j += 1){
                const subChain = chain.slice(i, j + 1)
                const start = chain[i]
                const end = chain[j]
                const cands1 = getBoardCell(board, start).candidates
                const cands2 = getBoardCell(board, end).candidates

                const sharedCandidates = intersection(cands1, cands2, candidatesEqual)
                if(sharedCandidates.length > 0){
                    const sharedCandidate = sharedCandidates[0]
                    const otherCandStart = getBoardCell(board, start).candidates.filter(c => c !== sharedCandidate)[0]
                    const otherCandEnd = getBoardCell(board, end).candidates.filter(c => c !== sharedCandidate)[0]

                    const isWeakForward = isWeakLinkedChainStartingWithCand(subChain, otherCandStart, sharedCandidate)
                    const isWeakBackward = isWeakLinkedChainStartingWithCand([...subChain].reverse(), otherCandEnd, sharedCandidate)

                    if(isWeakForward && isWeakBackward){
                        const affected = getAffectedPointsInCommon([start, end])

                        const effects = removeCandidateFromPoints(board, affected, sharedCandidate)
                        const actors = subChain.map(point => ({point}))
                        if(effects.length > 0){
                            yield {effects, actors}
                        }
                    }
                }
            }
        }
    }

    return null
}

export const remotePairChain: Technique = (board: SolverBoard) => first(remotePairChainGenerator(board))
export const allRemotePairChains: Technique = (board: SolverBoard) => allResults(remotePairChainGenerator(board))

export const xyChain: Technique = (board: SolverBoard) => first(xyChainGenerator(board))
export const allXyChains: Technique = (board: SolverBoard) => allResults(xyChainGenerator(board))