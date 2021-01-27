import { Technique } from '../types'

export const getCombinations = <T>(items: T[], len: number, initIndex = 0): T[][] => {
    if(len === 0) return []
    const combos: T[][] = []
    // NB: Stop loop before it gets so far as to not have enough items left for a full combo
    for(let i = initIndex; i < items.length-len+1; i++){
        const rest = getCombinations(items, len - 1, i + 1)
        if(rest.length === 0){
            combos.push([items[i]])
        }
        for(let combo of rest){
            combos.push([items[i], ...combo])
        }
    }
    return combos
}

export const first = <T>(iterable: Iterable<T>) => iterable[Symbol.iterator]().next().value
export const allResults = (iterable: Iterable<ReturnType<Technique>>) => {
    return Array.from(iterable)
        .reduce<ReturnType<Technique>>((allResults, result) => {
            if(result === null) return allResults
            if(allResults === null){
                allResults = {effects: [], actors: []}
            }
            allResults.effects.push(...result.effects)
            allResults.actors.push(...result.actors)
            return allResults
        }, null)
}

export const unique = <T>(arr: T[]): T[] => [...new Set(arr)]
export const uniqueBy = <T>(arr: T[], isEqual): T[] => {
    const result: T[] = []
    arr.forEach(a => {
        if(!result.some(b => isEqual(a, b))){
            result.push(a)
        }
    })
    return result
}
export const difference = <T>(arr1: T[], arr2: T[], isEqual): T[] => {
    return arr1.filter(a => !arr2.some(b => isEqual(a, b)))
}
export const intersection = <T>(arr1: T[], arr2: T[], isEqual): T[] => {
    return uniqueBy([...arr1, ...arr2], isEqual).filter(x => arr1.some(a => isEqual(a, x) && arr2.some(a => isEqual(a, x))))
}
export const intersectionOfAll = <T>(arr: T[][], isEqual): T[] => {
    return uniqueBy(arr.flat(), isEqual).filter(x => arr.every(subArr => subArr.some(a => isEqual(a, x))))
}
export const arraysEqual = (arr1, arr2, isEqual) => {
    return arr1.length === arr2.length && arr1.every((a, i) => isEqual(a, arr2[i]))
}
type Groups<T> = {[key: string]: T[]}
export const groupBy = <T>(arr: T[], by): Groups<T> => {
    return arr.reduce((groups, item) => {
        const key = by(item)
        groups[key] = (groups[key] ?? [])
        groups[key].push(item)
        return groups
    }, {})
}

export const memoize = <T extends Function>(fn: T, getKey): T => {
    let memo = {}
    return ((...args) => {
        const key = getKey(...args)
        if(memo.hasOwnProperty(key)) return memo[key]
        const result = fn(...args)
        memo[key] = result
        return result
    }) as unknown as T
}