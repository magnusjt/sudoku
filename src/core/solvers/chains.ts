import {
    Actor,
    Effect,
    EliminationEffect,
    Point,
    SolverBoard,
} from '../types'
import {
    removeCandidateFromPoints,
    removeCandidatesFromPoints
} from '../utils/effects'
import { allResults, arraysEqual, difference, first, intersectionOfAll, unique } from '../utils/misc'
import {
    allCandidates,
    candidatesExcept,
    getAffectedPoints,
    getAffectedPointsInCommon,
    getAllPoints,
    getAllUnfilledPoints,
    getBoardCell,
    getBox,
    getBoxNumber,
    getColNumber,
    getColumn,
    getPointsWithCandidates,
    getPointsWithNCandidates,
    getRow,
    getRowNumber,
    pointsEqual,
    pointsSeeEachOther,
} from '../utils/sudokuUtils'
import {
    createTable,
    getAllLinks,
    getPointKey,
    Link,
    LinkNode,
    SingleLink,
    SingleNode,
    SingleTable,
    Table
} from './chainGraph'

const linkIsInternal = (link: Link) => {
    const prevPoints = link.prev.type === 'single' ? [link.prev.point] : link.prev.points
    const nextPoints = link.next.type === 'single' ? [link.next.point] : link.next.points

    return intersectionOfAll([prevPoints, nextPoints], pointsEqual).length > 0
}

type QueueItem = {
    seen: Set<number | string>
    chain: Link[]
}

const getSeenKey = (node: LinkNode) => node.type === 'single' ? node.point.id : node.groupId

const iterateChainsInTable = (table: Table, keepLink, check, maxDepth: number = 13) => {
    const isValidNextLink = (queueItem: QueueItem, link: Link) => {
        const first: SingleLink = queueItem.chain[0] as SingleLink
        const last = queueItem.chain[queueItem.chain.length - 1]

        const requiredLinkType = last.type === 'strong' ? 'weak' : 'strong'

        const lastWasInternal = linkIsInternal(last)
        const nextIsInternal = linkIsInternal(link)

        const isLoop = link.next.type !== 'group' && first.prev.point.id === link.next.point.id
        const isLasso = !isLoop && !nextIsInternal && queueItem.seen.has(getSeenKey(link.next))

        return (
            link.prev.cand === last.next.cand &&
            link.type === requiredLinkType &&
            !isLasso &&
            !(lastWasInternal && nextIsInternal) &&
            keepLink(link)
        )
    }

    const queue: QueueItem[] = Object.values(table)
        .flatMap(x => x.links
            .filter(link => keepLink(link) && link.prev.type === 'single')
            .map(link => ({ chain: [link], seen: new Set([getSeenKey(link.prev)]) }))
        )

    let i = 0
    while(i < queue.length){
        const queueItem = queue[i++] // Don't shift the queue. Turns out to be super slow when it becomes large.
        const { chain } = queueItem
        const firstLink = chain[0] as SingleLink
        const lastLink = chain[chain.length - 1]

        if(lastLink.next.type !== 'group'){
            const isLoop = firstLink.prev.point.id === lastLink.next.point.id
            if(check(chain, isLoop)){
                return true
            }
        }

        const nextLinks = getAllLinks(table, lastLink.next).filter(link => isValidNextLink(queueItem, link))
        const seen = new Set([...queueItem.seen, getSeenKey(lastLink.next)])
        if(queueItem.chain.length >= maxDepth){
            continue
        }

        for(let nextLink of nextLinks){
            queue.push({ chain: [...chain, nextLink], seen })
        }
    }

    return false
}

const chainToActors = (chain: Link[]): Actor[] => {
    const first = chain[0].prev.type === 'single'
        ? [{
            point: chain[0].prev.point,
            cand: chain[0].prev.cand,
            chainSet: chain[0].type === 'strong' ? 'no' as const : 'yes' as const
        }]
        : chain[0].prev.points.map(point => ({
            point: point,
            cand: chain[0].prev.cand,
            chainSet: chain[0].type === 'strong' ? 'no' as const : 'yes' as const
        }))

    return [
        ...first,
        ...chain.flatMap(link => {
            if(link.next.type === 'single'){
                return [{
                    point: link.next.point,
                    cand: link.next.cand,
                    chainSet: link.type === 'strong' ? 'yes' as const : 'no' as const
                }]
            }
            return link.next.points.map(point => ({
                point: point,
                cand: link.next.cand,
                chainSet: link.type === 'strong' ? 'yes' as const : 'no' as const
            }))
        }),
    ]
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
export function remotePairChain(board: SolverBoard){
    const biValuePoints = getPointsWithNCandidates(board, getAllPoints(), 2)
    const table = createTable(board, biValuePoints, allCandidates, false)

    let result: any = null
    const keepLink = (link: SingleLink) => {
        // Every link is between pairs
        return arraysEqual(
            getBoardCell(board, link.prev.point).candidates,
            getBoardCell(board, link.next.point).candidates,
            (a, b) => a === b
        )
    }
    const maxDepth = 20
    iterateChainsInTable(table, keepLink, (chain: SingleLink[], isLoop) => {
        if(isLoop) return false
        if(chain.length <= 2) return false
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

        if(effects.length > 0){
            result = {effects, actors: chainToActors(chain)}
            return true
        }
    }, maxDepth)

    return result
}

/**
 * x chains consider only one candidate in a chain.
 * It should start and end with a strong link.
 * An initial strong link means we start by NOT choosing the candidate, then follow the chain.
 * An ending strong link means that the final value will definitely be the candidate given the initial strong link.
 */
export function xChain(board: SolverBoard){
    const unfilledPoints = getAllUnfilledPoints(board)
    const table = createTable(board, unfilledPoints, allCandidates, false)

    const maxDepth = 10
    let result: any = null
    const keepLink = (link: SingleLink) => link.prev.cand === link.next.cand
    iterateChainsInTable(table, keepLink, (chain: SingleLink[], isLoop) => {
        if(isLoop) return false
        if(chain.length <= 2) return false
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

        if(effects.length > 0){
            result = {effects, actors: chainToActors(chain)}
            return true
        }
    }, maxDepth)

    return result
}


/**
 * xy chains consider only bi value points
 * Like x chains and remote pairs, they must start and end with strong links
 * Also, the initial and final links must be on the same candidate.
 * This ensures that the candidate is in one of those cells.
 */
export function xyChain(board: SolverBoard){
    const biValuePoints = getPointsWithNCandidates(board, getAllPoints(), 2)
    const table = createTable(board, biValuePoints, allCandidates, false)

    const maxDepth = 20
    let result: any = null
    const keepLink = () => true
    iterateChainsInTable(table, keepLink, (chain: Link[], isLoop) => {
        if(isLoop) return false
        if(chain.length <= 2) return false
        const firstLink = chain[0] as SingleLink
        const lastLink = chain[chain.length - 1] as SingleLink
        // NOTE: We might restrict each strong link to be within cells as well.
        // Right now we allow strong links to go directly to other cells.
        // Not sure if this is still considered an xy chain. I guess it still is, but with fewer steps.
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

        if(effects.length > 0){
            result = {effects, actors: chainToActors(chain)}
            return true
        }
    }, maxDepth)

    return result
}

const getDiscontinuousNiceLoop = (board: SolverBoard, chain: Link[], isLoop: boolean) => {
    if(!isLoop){
        return null
    }

    const firstLink = chain[0] as SingleLink
    const lastLink = chain[chain.length - 1] as SingleLink

    if(firstLink.type === 'strong' && lastLink.type === 'strong' && firstLink.prev.cand === lastLink.next.cand){
        const effects = removeCandidatesFromPoints(board, [firstLink.prev.point], candidatesExcept([firstLink.prev.cand]))
        if(effects.length > 0){
            return {effects, actors: chainToActors(chain)}
        }
    }
    if(firstLink.type === 'weak' && lastLink.type === 'strong' && firstLink.prev.cand !== lastLink.next.cand){
        const effects = removeCandidatesFromPoints(board, [firstLink.prev.point], [firstLink.prev.cand])
        if(effects.length > 0){
            return {effects, actors: chainToActors(chain)}
        }
    }

    return null
}

const getContinuousNiceLoop = (board: SolverBoard, chain: Link[], isLoop: boolean) => {
    if(!isLoop){
        return null
    }

    const firstLink = chain[0] as SingleLink
    const lastLink = chain[chain.length - 1] as SingleLink

    if(
        (
            (firstLink.type === 'weak' && lastLink.type === 'strong') ||
            (firstLink.type === 'strong' && lastLink.type === 'weak')
        ) &&
        firstLink.prev.cand === lastLink.next.cand
    ){
        const pointsInChain = chain.map(link => link.next.point) // It's a loop, so the first point is included
        const weakLinks = chain.filter(link => link.type === 'weak')

        const effects: Effect[] = []

        for(let link of weakLinks){
            if(linkIsInternal(link)){
                effects.push(
                    ...removeCandidatesFromPoints(board, [link.prev.point], candidatesExcept([link.prev.cand, link.next.cand]))
                )
            }else{
                let pointsToRemove: Point[] = []
                if(getBoxNumber(link.prev.point) === getBoxNumber(link.next.point)){
                    pointsToRemove.push(...getBox(link.prev.point))
                }
                if(getColNumber(link.prev.point) === getColNumber(link.next.point)){
                    pointsToRemove.push(...getColumn(link.prev.point.x))
                }
                if(getRowNumber(link.prev.point) === getRowNumber(link.next.point)){
                    pointsToRemove.push(...getRow(link.prev.point.y))
                }
                pointsToRemove = difference(pointsToRemove, pointsInChain, pointsEqual)
                const cand = link.next.cand
                effects.push(
                    ...removeCandidatesFromPoints(board, pointsToRemove, [cand])
                )
            }
        }
        if(effects.length > 0){
            return {effects, actors: chainToActors(chain)}
        }
    }
    return null
}

const getAicType1 = (board: SolverBoard, chain: Link[], isLoop: boolean) => {
    const firstLink = chain[0] as SingleLink
    const lastLink = chain[chain.length - 1] as SingleLink

    if(isLoop){
        return null
    }

    if(firstLink.type === 'strong' && lastLink.type === 'strong'){
        const cand = firstLink.prev.cand
        const affected = getAffectedPointsInCommon([firstLink.prev.point, lastLink.next.point])
        const effects = removeCandidatesFromPoints(board, affected, [cand])

        if(effects.length > 0){
            return {effects, actors: chainToActors(chain)}
        }
    }

    return null
}

const getAicType2 = (board: SolverBoard, chain: Link[], isLoop: boolean) => {
    const firstLink = chain[0] as SingleLink
    const lastLink = chain[chain.length - 1] as SingleLink

    if(isLoop){
        return null
    }

    if(!(firstLink.type === 'strong' && lastLink.type === 'strong')){
        if(pointsSeeEachOther(firstLink.prev.point, lastLink.next.point)){
            const effects = [
                ...removeCandidateFromPoints(board, [firstLink.prev.point], lastLink.next.cand),
                ...removeCandidateFromPoints(board, [lastLink.next.point], firstLink.prev.cand)
            ]

            if(effects.length > 0){
                return {effects, actors: chainToActors(chain)}
            }
        }
    }

    return null
}

export const chainMaker = (board: SolverBoard) => {
    const results = []

    const init = () => {
        const maxDepth = 13
        const unfilledPoints = getAllUnfilledPoints(board)
        const table = createTable(board, unfilledPoints, allCandidates, true)
        const keepLink = () => true

        iterateChainsInTable(table, keepLink, (chain: Link[], isLoop) => {
            if(chain.length <= 2) return false

            getDiscontinuousNiceLoop(board, chain, isLoop)
            getAicType1(board, chain, isLoop)
            getAicType2(board, chain, isLoop)
            getContinuousNiceLoop(board, chain, isLoop)

            return false
        }, maxDepth)
    }

    return (type) => {
        init()
    }
}

function *simpleColoringGenerator(board: SolverBoard){
    const unfilledPoints = getAllUnfilledPoints(board)
    const table: SingleTable = createTable(board, unfilledPoints, allCandidates, false) as SingleTable
    const oppositeColor = (color) => color === 'yes' ? 'no' : 'yes'

    const getNextQueueItems = (pointKey: string, cand: number, color: string) => {
        return table[pointKey].links
            .filter(link => link.prev.cand === cand && link.next.cand === cand && link.type === 'strong')
            .map(link => ({ point: link.next.point, color }))
    }

    const colorFromPoint = (startingPoint: Point, cand: number) => {
        const startingKey = getPointKey(startingPoint)
        const colors = {[startingKey]: { color: 'yes', point: startingPoint }}
        const queue = getNextQueueItems(startingKey, cand, 'no')

        while(queue.length > 0){
            const { point, color } = queue.shift()!

            const key = getPointKey(point)
            if(colors[key]) continue
            colors[key] = {color, point}

            queue.push(...getNextQueueItems(key, cand, oppositeColor(color)))
        }

        return colors
    }

    // Sort so we get easier results first
    const candsWithPoints = allCandidates
        .map(cand => {
            return {
                cand,
                points: getPointsWithCandidates(board, unfilledPoints, [cand])
            }
        })
        .sort((a, b) => a.points.length - b.points.length)

    for(let { cand, points } of candsWithPoints){
        // Avoid checking points within the same coloring multiple times
        const checked = new Set()
        for(let startingPoint of points){
            if(checked.has(getPointKey(startingPoint))) continue

            const colors = colorFromPoint(startingPoint, cand)

            Object.values(colors).forEach(({point}) => {
                checked.add(getPointKey(point))
            })

            if(Object.values(colors).length > 18) continue // 9*2=18, that is each e.g. row has a conjugate pair. Doesn't make sense to color in more than that?

            const uncoloredPoints = points.filter(point => !colors[getPointKey(point)])

            const effects: EliminationEffect[] = []

            // Check color traps:
            // All points seeing two different colors must be eliminated, since one of those colors must mean that the cand is set
            for(let uncoloredPoint of uncoloredPoints){
                const seenColors = unique(
                    getAffectedPoints(uncoloredPoint)
                        .map(affected => colors[getPointKey(affected)]?.color ?? '')
                        .filter(color => color !== '')
                )

                if(seenColors.length === 2){
                    effects.push(...removeCandidateFromPoints(board, [uncoloredPoint], cand))
                }
            }

            // Check color wraps:
            // Points with the same color seeing each other must all be false
            for(let {point, color} of Object.values(colors)){
                const seesSameColor = getAffectedPoints(point)
                    .some(affected => colors[getPointKey(affected)]?.color === color)

                if(seesSameColor){
                    effects.push(...removeCandidateFromPoints(board, [point], cand))
                }
            }

            const actors = Object.values(colors).map(x => ({point: x.point}))

            if(effects.length > 0){
                yield {effects, actors}
            }
        }
    }

    return null
}

export const simpleColoring = (board: SolverBoard) => first(simpleColoringGenerator(board))
export const allSimpleColorings = (board: SolverBoard) => allResults(simpleColoringGenerator(board))