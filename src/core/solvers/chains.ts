import { Point, SolverBoard, Technique } from '../types'
import { removeCandidatesFromPoints } from '../utils/effects'
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
const buildGraph = (allowedPoints: Point[], isLinked) => {
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
 * So if any cells length 4+2n apart has cells they see in common, we can eliminate the pair candidates from that cell.
 * Just like a normal naked pair actually, but with more steps.
 */
function *remotePairGenerator(board: SolverBoard){
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
                    const actors = chain.slice(i, j).map(point => ({point}))
                    if(effects.length > 0){
                        yield {effects, actors}
                    }
                }
            }
        }
    }

    return null
}

export const remotePairChain: Technique = (board: SolverBoard) => first(remotePairGenerator(board))
export const allRemotePairChains: Technique = (board: SolverBoard) => allResults(remotePairGenerator(board))