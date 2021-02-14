import { EliminationEffect, Point, SolverBoard } from '../types'
import { allCandidates, getAffectedPoints, getAllUnfilledPoints, getPointsWithCandidates } from '../utils/sudokuUtils'
import { createTable, getPointKey, SingleTable } from './chainGraph'
import { allResults, first, unique } from '../utils/misc'
import { removeCandidateFromPoints } from '../utils/effects'

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