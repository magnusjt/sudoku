import { EliminationEffect, Point, SolverBoard, Technique, ValueEffect } from '../types'
import {
    removeCandidateFromAffectedPoints,
    removeCandidatesFromPoints
} from '../utils/effects'
import { first, unique } from '../utils/misc'
import {
    allCandidates, cloneBoard,
    getAffectedPointsInCommon, getAllHousesMinusFilledPoints,
    getAllPoints, getAllUnfilledPoints,
    getBoardCell,
    getPointsWithNCandidates,
} from '../utils/sudokuUtils'

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

/**
 * Find all naked and hidden singles that result from a strong link (e.g. where a candidate is NOT set).
 * Hinges on all actual singles being found before doing this.
 * Also: I guess one could do a lot more here, but singles are kind of the "direct" effect.
 * TODO: We should really check that the singles we find are part of the affected cells of the strong link, but it probably won't matter (?)
 *
 * NB: We need to find naked singles because eliminating a candidate for a strong link may mean the strong link
 * is between the candidate and another candidate in the cell (which is now a naked single)
 */
const getSingleEffects = (board: SolverBoard) => {
    const effects: ValueEffect[] = []

    // Hidden singles
    for(let points of getAllHousesMinusFilledPoints(board)){
        for(let cand = 1; cand <= 9; cand++){
            const pointsWithCand = points.filter(p => getBoardCell(board, p).candidates.some(c => c === cand))
            if(pointsWithCand.length === 1){
                const point = pointsWithCand[0]
                effects.push({type: 'value', point, number: cand} as const)
            }
        }
    }

    // Naked singles
    getPointsWithNCandidates(board, getAllPoints(), 1)
        .forEach(point => {
            const cand = getBoardCell(board, point).candidates[0]
            effects.push({type: 'value', point, number: cand} as const)
        })

    // Should really dedup results here

    return effects
}

/**
 * The table concept I glanced from hodoku. Called trebors tables or something like that.
 * The idea is to record what effects occur when a candidate is either set or not set. Only direct effects are considered.
 * Direct in this case is hidden/naked singles and just basic eliminations.
 * When a candidate is set, we can use it to make weak links towards all its effected cells. Effects are basic eliminations.
 * When a candidate is not set, we can use it to make strong links towards all its effected cells. Effects are naked/hidden singles here.
 */
const createTable = (board: SolverBoard, points: Point[], cands: number[]) => {
    board = cloneBoard(board)
    const table: Table = {}
    for(let point of points){
        for(let cand of cands){
            const cell = getBoardCell(board, point)
            if(!cell.candidates.includes(cand)){
                continue
            }

            const effectsIfTrue = removeCandidateFromAffectedPoints(board, point, cand) as EliminationEffect[]

            // Temporarily remove candidate to find effectsIfFalse
            // NB: Will find effects on totally unrelated hidden singles as well, so don't run this until all hidden singles are found
            cell.candidates = cell.candidates.filter(c => c !== cand)
            const effectsIfFalse = getSingleEffects(board)
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

const getLinkKey = (point, cand) => {
    return `${getPointKey(point)}${cand}`
}

/**
 * A chain alternates between weak and strong links. This ensures the next step follows the one before it.
 * (Set value -> (weak) -> dont't set value -> (strong) -> set value -> etc).
 *
 * TODO: Check shortest chains first
 */
const iterateChainsInTable = (table: Table, keepLink, check) => {
    const followLink = (link, requiredType = 'weak', prevChain, seen) => {
        const key = getLinkKey(link.next.point, link.next.cand)
        if(seen.has(key)){
            return false
        }
        // The cand is now set/removed when starting from prev point. Prevent it from being set/removed again
        // If we're to implement forcing chains, this won't work as we need to look for contradictions.
        // Can probably implement that around here.
        seen = new Set([...seen]).add(getLinkKey(link.prev.point, link.prev.cand))

        if(!keepLink(link)){
            return false
        }

        const chain = [...prevChain, link]
        if(chain.length >= 12){  // Need a better limit. Links between candidates in cells are not too taxing on the brain, but links between cells are.
            return false
        }
        if(check(chain)){
            return true
        }

        // Although a strong link can be followed by a strong or weak link (as a strong link can be used as a weak link),
        // we have to choose the weak link. This is because link types must be alternating (the candidate is not set -> leads to set -> not set -> etc).
        // Afterall, we record both strong and weak links in the table,
        // so if a link is strong, we have the weak counterpart recorded anyways.
        const nextLinkType = link.type === 'strong' ? 'weak' : 'strong'
        const cand = link.next.cand

        const nextLinks = getAllLinks(table, link.next.point)
            .filter(link => link.prev.cand === cand && link.type === nextLinkType)

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
 *
 * This implementation is basically the same as for xy chains, but with the restriction that all cells in
 * the chain must have the same candidates. This ensures that the result is actually a remote pair instead of an xy chain.
 * See comments below for more details.
 */
function *remotePairChainGenerator2(board: SolverBoard){
    const biValuePoints = getPointsWithNCandidates(board, getAllPoints(), 2)
    const table = createTable(board, biValuePoints, allCandidates)

    let result: any = null
    const keepLink = (link) => {
        // Every link is between pairs
        return unique([
            ...getBoardCell(board, link.prev.point).candidates,
            ...getBoardCell(board, link.next.point).candidates,
        ]).length === 2
    }
    iterateChainsInTable(table, keepLink, (chain: Link[]) => {
        if(chain.length <= 2) return false;
        const firstLink = chain[0]
        const lastLink = chain[chain.length - 1]
        // Starts and ends with strong link. Read this as:
        // If we DON'T start with the candidate in the first cell of the chain
        // then the last cell will definitely contain the candidate
        // So the candidate is in either the first or the last cell
        if(!(firstLink.type === 'strong' && lastLink.type === 'strong')){
            return false
        }
        // Make sure that the ending candidate is actually the same as the starting candidate
        if(firstLink.prev.cand !== lastLink.next.cand){
            return false
        }
        const start = firstLink.prev.point
        const end = lastLink.next.point
        // Yes, we can eliminate both candidates.
        // Why? Because we already check that all cells in the chain have the same two candidates.
        // We can then start with the other candidate and arrive at the exact same conclusion.
        const cands = getBoardCell(board, start).candidates
        const affected = getAffectedPointsInCommon([start, end])
        const effects = removeCandidatesFromPoints(board, affected, cands)
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

/**
 * x chains consider only one candidate in a chain.
 * It should start and end with a strong link.
 * An initial strong link means we start by NOT choosing the candidate, then follow the chain.
 * An ending strong link means that the final value will definitely be the candidate given the initial strong link.
 */
function *xChainGenerator(board: SolverBoard){
    const unfilledPoints = getAllUnfilledPoints(board)
    const table = createTable(board, unfilledPoints, allCandidates)

    let result: any = null
    const keepLink = (link: Link) => link.prev.cand === link.next.cand
    iterateChainsInTable(table, keepLink, (chain: Link[]) => {
        if(chain.length <= 2) return false;
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

/**
 * xy chains consider only bi value points
 * Like x chains and remote pairs, they must start and end with strong links
 * Also, the initial and final links must be on the same candidate.
 * This ensures that the candidate is in one of those cells.
 */
function *xyChainGenerator(board: SolverBoard){
    const biValuePoints = getPointsWithNCandidates(board, getAllPoints(), 2)
    const table = createTable(board, biValuePoints, allCandidates)

    let result: any = null
    const keepLink = () => true
    iterateChainsInTable(table, keepLink, (chain: Link[]) => {
        if(chain.length <= 2) return false;
        const firstLink = chain[0]
        const lastLink = chain[chain.length - 1]
        if(!(firstLink.type === 'strong' && lastLink.type === 'strong')){
            return false
        }
        if(firstLink.prev.cand !== lastLink.next.cand){
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

export const remotePairChain: Technique = (board: SolverBoard) => first(remotePairChainGenerator2(board))
//export const allRemotePairChains: Technique = (board: SolverBoard) => allResults(remotePairChainGenerator(board))

export const xChain: Technique = (board: SolverBoard) => first(xChainGenerator(board))
//export const allXChains: Technique = (board: SolverBoard) => allResults(xChainGenerator(board))

export const xyChain: Technique = (board: SolverBoard) => first(xyChainGenerator(board))
//export const allXyChains: Technique = (board: SolverBoard) => allResults(xyChainGenerator(board))