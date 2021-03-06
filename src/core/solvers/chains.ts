import {
    Actor,
    Effect,
    Point,
    SolverBoard,
    TechniqueResult,
} from '../types'
import {
    removeCandidateFromPoints,
    removeCandidatesFromPoints
} from '../utils/effects'
import { arraysEqual, difference, unique } from '../utils/misc'
import {
    allCandidates,
    candidatesExcept,
    getAffectedPointsInCommon,
    getAllPoints,
    getAllUnfilledPoints,
    getBoardCell,
    getBox,
    getBoxNumber,
    getColNumber,
    getColumn,
    getPointsWithNCandidates,
    getRow,
    getRowNumber,
    pointsEqual,
    pointsSeeEachOther,
} from '../utils/sudokuUtils'
import {
    createTable,
    getAllLinks,
    Link,
    LinkNode,
    SingleLink, SingleNode,
    Table
} from './chainGraph'

const getNodePoints = (node: LinkNode) => node.type === 'single' ? [node.point] : node.points

const linkIsInternalWithinPoint = (link: Link) => {
    if (link.prev.type === 'single' && link.next.type === 'single') {
        return link.prev.point.id === link.next.point.id
    }
    return false
}

type QueueItem = {
    seen: Set<number | string>
    chain: Link[]
}

const getSeenKeys = (node: LinkNode) => node.type === 'single' ? [node.point.id] : node.points.map(p => p.id)

const iterateChainsInTable = (table: Table, keepLink, check, maxDepth: number = 13) => {
    const isValidNextLink = (chain: Link[], seen: Set<string | number>, link: Link) => {
        const first = chain[0] as Link<SingleNode>
        const last = chain[chain.length - 1]

        if(link.prev.cand !== last.next.cand) return false

        const requiredLinkType = last.type === 'strong' ? 'weak' : 'strong'
        if(link.type !== requiredLinkType) return false

        if(!keepLink(link)) return false

        const lastWasInternal = linkIsInternalWithinPoint(last)
        const nextIsInternal = linkIsInternalWithinPoint(link)

        if(lastWasInternal && nextIsInternal) return false // Prevent eternal loop

        const isLoop = link.next.type !== 'group' && first.prev.point.id === link.next.point.id

        // Can't be lasso if loop or internal link
        if(isLoop) return true
        if(nextIsInternal) return true

        // NB: We don't check for internal links between groups or single<->group
        // That means that we'll not all those as lassos, and won't use the link

        const isLasso = getSeenKeys(link.next).some(key => seen.has(key))
        return !isLasso
    }

    let queue: QueueItem[] = Object.values(table)
        .flatMap(x => x.links
            .filter(link => keepLink(link) && link.prev.type === 'single')
            .map(link => ({ chain: [link], seen: new Set(getSeenKeys(link.prev)) }))
        )

    let i = 0
    while(i < queue.length){
        const queueItem = queue[i++] // Don't shift the queue. Turns out to be super slow when it becomes large.
        const { chain } = queueItem
        const firstLink = chain[0] as Link<SingleNode>
        const lastLink = chain[chain.length - 1]

        let isLoop = false
        if(lastLink.next.type !== 'group' && chain.length > 1){
            isLoop = firstLink.prev.point.id === lastLink.next.point.id
            if(check(chain, isLoop)){
                return true
            }
        }
        if(isLoop){
            continue
        }

        if(queueItem.chain.length >= maxDepth){
            continue
        }

        const seen = new Set([...queueItem.seen, ...getSeenKeys(lastLink.next)])
        const nextLinks = getAllLinks(table, lastLink.next).filter(link => isValidNextLink(chain, seen, link))
        for(let nextLink of nextLinks){
            queue.push({ chain: [...chain, nextLink], seen })
        }

        // Clear some memory every once in a while
        if(queue.length > 1000000){
            queue = queue.slice(i)
            i = 0
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

const chainIsAlternatingInternal = (chain: Link[]) => {
    for(let i = 0; i < chain.length; i += 2){
        if(!linkIsInternalWithinPoint(chain[i])) return false
    }
    return true
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
    const maxDepth = 12
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
        // Only want those chains that take into account the links between pairs
        if(!chainIsAlternatingInternal(chain)){
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

    const maxDepth = 12
    let result: any = null
    const keepLink = () => true
    iterateChainsInTable(table, keepLink, (chain: Link[], isLoop) => {
        if(isLoop) return false
        if(chain.length <= 2) return false
        if(!chainIsAlternatingInternal(chain)) return false
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

    // first OFF and last ON and same cand -> contradiction. It must be the candidate
    if(firstLink.type === 'strong' && lastLink.type === 'strong' && firstLink.prev.cand === lastLink.next.cand){
        const effects = removeCandidatesFromPoints(board, [firstLink.prev.point], candidatesExcept([firstLink.prev.cand]))
        if(effects.length > 0){
            return {effects, actors: chainToActors(chain)}
        }
    }
    // first ON and last OFF and same cand -> contradiction. It can't be the candidate
    if(firstLink.type === 'weak' && lastLink.type === 'weak' && firstLink.prev.cand === lastLink.next.cand){
        const effects = removeCandidatesFromPoints(board, [firstLink.prev.point], [firstLink.prev.cand])
        if(effects.length > 0){
            return {effects, actors: chainToActors(chain)}
        }
    }

    // first ON and last ON and not same cand -> contradiction. It can't be the candidate
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
        const pointsInChain = chain.flatMap(link => getNodePoints(link.next)) // It's a loop, so the first point is included
        const weakSingleLinks = chain.filter(link => link.type === 'weak')

        const effects: Effect[] = []

        for(let link of weakSingleLinks){
            // TODO: What about internal links with grouping? Think it doesn't matter..
            if(linkIsInternalWithinPoint(link) && link.prev.type === 'single' && link.next.type === 'single'){
                effects.push(
                    ...removeCandidatesFromPoints(board, [link.prev.point], candidatesExcept([link.prev.cand, link.next.cand]))
                )
            }else{
                let pointsToRemove: Point[] = []
                const prevPoints = getNodePoints(link.prev)
                const nextPoints = getNodePoints(link.next)

                // link within box
                const prevBoxes = unique(prevPoints.map(getBoxNumber))
                const nextBoxes = unique(nextPoints.map(getBoxNumber))
                if(prevBoxes.length === 1 && nextBoxes.length === 1 && prevBoxes[0] === nextBoxes[0]){
                    pointsToRemove.push(...getBox(prevPoints[0]))
                }

                // link within column
                const prevCols = unique(prevPoints.map(getColNumber))
                const nextCols = unique(nextPoints.map(getColNumber))
                if(prevCols.length === 1 && nextCols.length === 1 && prevCols[0] === nextCols[0]){
                    pointsToRemove.push(...getColumn(prevPoints[0].x))
                }

                // link within row
                const prevRows = prevPoints.map(getRowNumber)
                const nextRows = nextPoints.map(getRowNumber)
                if(prevRows.length === 1 && nextRows.length === 1 && prevRows[0] === nextRows[0]){
                    pointsToRemove.push(...getRow(prevPoints[0].y))
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
    if(isLoop){
        return null
    }

    const firstLink = chain[0] as SingleLink
    const lastLink = chain[chain.length - 1] as SingleLink

    if(firstLink.type === 'strong' && lastLink.type === 'strong' && firstLink.prev.cand === lastLink.next.cand){
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
    if(isLoop){
        return null
    }

    const firstLink = chain[0] as SingleLink
    const lastLink = chain[chain.length - 1] as SingleLink

    if(firstLink.type === 'strong' && lastLink.type === 'strong' && firstLink.prev.cand !== lastLink.next.cand){
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

const isGrouped = (chain: Link[]) => chain.some(link => link.prev.type === 'group' || link.next.type === 'group')

export const createFindChain = (board: SolverBoard, allowStopEarly = true) => {
    const results: {name: string, result: TechniqueResult, depth: number}[] = []
    const addResult = (result: TechniqueResult | null, name: string, chain) => {
        if(result !== null){
            const grouped = isGrouped(chain) ? 'Grouped' : ''
            results.push({name: name + grouped, result, depth: chain.length})
        }
    }

    let checked = 0

    /*
    Normally we check all chains up to a certain depth before stopping.
    The reason is that we don't want to do the whole thing again when looking for the next chain type.
    But looking through all these chains can be slow, and so we have to set the max depth to a low value.
    Instead, we can have a middle ground with an early-stop criteria, and can therefore increase the depth slightly.
     */
    const shouldStopEarly = (depth: number) => {
        if (!allowStopEarly) {
            return false
        }
        // Stop it from running forever in case the number of chains in each depth is totally crazy
        if (checked++ > 1000000) {
            return true
        }
        if (results.length === 0) {
            return false
        }
        // Favor loops
        if (results.some(x => x.name.includes('loop'))) {
            return true
        }
        // But we'll take an aic if it has more than one elimination
        if (results.some(x => x.name.includes('aic') && x.result.effects.length > 1)) {
            return true
        }
        // If we have a significantly shorter chain, always take it
        if (results.some(x => x.depth <= depth - 2)) {
            return true
        }
        return false
    }

    let initialized = false

    const init = (name) => {
        initialized = true
        const maxDepth = 12
        const unfilledPoints = getAllUnfilledPoints(board)
        const table = createTable(board, unfilledPoints, allCandidates, true)
        const keepLink = () => true
        let depth = 0

        iterateChainsInTable(table, keepLink, (chain: Link[], isLoop) => {
            if(chain.length <= 2) return false

            if(chain.length > depth){
                depth = chain.length
                // console.log(depth)
            }

            addResult(getDiscontinuousNiceLoop(board, chain, isLoop), 'discontinuousNiceLoop', chain)
            addResult(getAicType1(board, chain, isLoop), 'aicType1', chain)
            addResult(getAicType2(board, chain, isLoop), 'aicType2', chain)
            addResult(getContinuousNiceLoop(board, chain, isLoop), 'continuousNiceLoop', chain)

            if (shouldStopEarly(depth)) {
                return true
            }

            return results.some(x => x.name === name)
        }, maxDepth)

        results.sort((a, b) => {
            const actorsDiff = a.result.actors.length - b.result.actors.length
            const effectsDiff = b.result.effects.length - a.result.effects.length
            return actorsDiff !== 0 ? actorsDiff : effectsDiff
        })
    }

    return (name) => {
        if(!initialized){
            init(name)
        }
        return results.find(x => x.name === name)?.result ?? null
    }
}

export const aicType1 = (findChain) => () => findChain('aicType1')
export const aicType2 = (findChain) => () => findChain('aicType2')
export const aicType1Grouped = (findChain) => () => findChain('aicType1Grouped')
export const aicType2Grouped = (findChain) => () => findChain('aicType2Grouped')
export const discontinuousNiceLoop = (findChain) => () => findChain('discontinuousNiceLoop')
export const discontinuousNiceLoopGrouped = (findChain) => () => findChain('discontinuousNiceLoopGrouped')
export const continuousNiceLoop = (findChain) => () => findChain('continuousNiceLoop')
export const continuousNiceLoopGrouped = (findChain) => () => findChain('continuousNiceLoopGrouped')