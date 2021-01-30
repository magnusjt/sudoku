import { Board, EliminationEffect, Point, SolverBoard, Technique, ValueEffect } from '../types'
import {
    removeCandidateFromAffectedPoints,
    removeCandidateFromPoints,
    removeCandidatesFromPoints
} from '../utils/effects'
import { allResults, first, getCombinations, intersection } from '../utils/misc'
import {
    allCandidates, cloneBoard,
    getAffectedPoints, getAffectedPointsInCommon,
    getAllPoints, getAllUnfilledPoints,
    getBoardCell, getBox, getBoxNumber, getColumn, getPointsWithCandidates,
    getPointsWithNCandidates, getRow,
    pointsEqual
} from '../utils/sudokuUtils'
import { allHiddenSingles } from './singles'

const getPointKey = (point: Point) => `${point.y}-${point.x}`

type Link = {
    type: 'weak' | 'strong'
    prev: {
        point: Point
        cand: number
    }
    next: {
        point: Point
        cand: number
    }
}

type Table = {
    [key: string]: {
        point: Point
        links: Link[]
    }
}

const getLinks = (effectsIfTrue: EliminationEffect[], effectsIfFalse: ValueEffect[], point: Point, cand: number): Link[] => {
    const prev = { point, cand }
    return [
        ...effectsIfFalse.map((eff) => ({
            type: 'strong',
            prev,
            next: {
                point: eff.point,
                cand: eff.number
            }
        } as unknown as Link)),
        ...effectsIfTrue.flatMap((eff) => eff.numbers.map(cand => ({
            type: 'weak',
            prev,
            next: {
                point: eff.point,
                cand
            }
        } as Link)))
    ]
}

const createTable = (board: Board, points: Point[], cands: number[]) => {
    board = cloneBoard(board)
    const table: Table = {}
    for(let point of points){
        for(let cand of cands){
            const cell = getBoardCell(board, point)
            if(!cell.candidates.includes(cand)){
                continue
            }
            const effectsIfTrue = removeCandidateFromAffectedPoints(board, point, cand) as EliminationEffect[]

            cell.candidates = cell.candidates.filter(c => c !== cand)

            // NB: Will find effects on totally unrelated hidden singles as well, so don't run this until all hidden singles are found
            const result = allHiddenSingles(board)
            const effectsIfFalse: ValueEffect[] = result !== null
                ? result.effects.filter(eff => eff.type === 'value') as ValueEffect[] // Only set values are direct effects
                : []
            cell.candidates.push(cand)

            if(effectsIfTrue.length > 0 || effectsIfFalse.length > 0){
                const links = getLinks(effectsIfTrue, effectsIfFalse, point, cand)
                table[getPointKey(point)] = table[getPointKey(point)] ?? { point, links: [] }
                table[getPointKey(point)].links.push(...links)
            }
        }
    }
    return table
}

const getAllLinks = (table: Table, point: Point) => {
    const item = table[getPointKey(point)]
    return item ? item.links : []
}

const iterateChainsInTable = (table: Table, keepLink, check) => {
    const followLink = (link, requiredType = 'weak', prevChain, seen) => {
        const key = getPointKey(link.next.point)
        if(seen.has(key)){
            return false
        }
        seen = new Set([...seen]).add(getPointKey(link.prev.point))

        // Only check if link is weak. Strong is valid in all cases.
        if(link.type === 'weak'){
            if(requiredType === 'strong'){
                return false
            }
            requiredType = 'strong'
        } else {
            requiredType = 'weak'
        }

        if(!keepLink(link)){
            return false
        }

        const chain = [...prevChain, link]
        if(chain.length >= 8){
            return false // Longer chains are too hard
        }
        if(check(chain)){
            return true
        }

        const cand = link.next.cand
        const nextLinks = getAllLinks(table, link.next.point).filter(link => link.prev.cand === cand)
        for(let nextLink of nextLinks){
            const done = followLink(nextLink, requiredType, chain, seen)
            if(done) return true
        }

    }

    for(let { links } of Object.values(table)){
        for(let link of links){
            const done = followLink(link, 'weak', [], new Set())
            if(done) return true
        }
    }
}

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

// Something wrong here still...
function *xChainGenerator(board: SolverBoard){
    const unfilledPoints = getAllUnfilledPoints(board)
    const table = createTable(board, unfilledPoints, allCandidates)

    let result: any = null
    const keepLink = (link: Link) => {
        return link.prev.cand === link.next.cand
    }
    iterateChainsInTable(table, keepLink, (chain: Link[]) => {
        if(chain.length <= 2) return false;
        if(chain.length%2 === 0) return false; // Need to be alternating
        const firstLink = chain[0]
        const lastLink = chain[chain.length - 1]
        if(!(firstLink.type === 'strong' && lastLink.type === 'strong')){
            return false
        }
        const start = firstLink.prev.point
        const end = lastLink.next.point
        const cand = firstLink.prev.cand
        const affected = getAffectedPointsInCommon([start, end])
        const effects = removeCandidatesFromPoints(board, affected, [cand])
        const points = [
            chain[0].prev.point,
            ...chain.map(link => link.next.point),
        ]
        const actors = points.map(point => ({point}))
        if(effects.length > 0){
            result = {effects, actors}
            return true
        }
    })
    return result
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

    // Assumes that there are only two candidates in each cell in the chain
    const chainEndsWithDigit = (chain: Point[], cand: number, endingCand: number) => {
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
                const possibleXYChain = chain.slice(i, j + 1)
                const start = chain[i]
                const end = chain[j]
                const cands1 = getBoardCell(board, start).candidates
                const cands2 = getBoardCell(board, end).candidates

                const sharedCandidates = intersection(cands1, cands2, candidatesEqual)
                if(sharedCandidates.length > 0){
                    const sharedCandidate = sharedCandidates[0]
                    const otherCandStart = getBoardCell(board, start).candidates.filter(c => c !== sharedCandidate)[0]
                    const otherCandEnd = getBoardCell(board, end).candidates.filter(c => c !== sharedCandidate)[0]

                    const isWeakForward = chainEndsWithDigit(possibleXYChain, otherCandStart, sharedCandidate)
                    const isWeakBackward = chainEndsWithDigit([...possibleXYChain].reverse(), otherCandEnd, sharedCandidate)

                    if(isWeakForward && isWeakBackward){
                        const affected = getAffectedPointsInCommon([start, end])

                        const effects = removeCandidateFromPoints(board, affected, sharedCandidate)
                        const actors = possibleXYChain.map(point => ({point}))
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

export const xChain: Technique = (board: SolverBoard) => first(xChainGenerator(board))
export const allXChains: Technique = (board: SolverBoard) => allResults(xChainGenerator(board))

export const xyChain: Technique = (board: SolverBoard) => first(xyChainGenerator(board))
export const allXyChains: Technique = (board: SolverBoard) => allResults(xyChainGenerator(board))