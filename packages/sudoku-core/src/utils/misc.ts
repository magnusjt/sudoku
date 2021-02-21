export const getCombinations = <T>(items: T[], len: number, initIndex = 0): T[][] => {
    if(len === 0) return []
    const combos: T[][] = []
    // NB: Stop loop before it gets so far as to not have enough items left for a full combo
    for(let i = initIndex; i < items.length-len+1; i++){
        const rest = getCombinations(items, len - 1, i + 1)
        if(rest.length === 0){
            combos.push([items[i]])
        }
        for(const combo of rest){
            combos.push([items[i], ...combo])
        }
    }
    return combos
}

const isNotNull = <T>(x: T): x is Exclude<T, null> => x !== null

export const first = <T>(iterable: Iterable<T | null>): T | null => iterable[Symbol.iterator]().next().value
export const allResults = <T>(iterable: Iterable<T | null>): T[] =>
    Array.from(iterable).filter(isNotNull)

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
export const intersectionOfAll = <T>(arr: T[][], isEqual): T[] => {
    return uniqueBy(arr.flat(), isEqual).filter(x => arr.every(subArr => subArr.some(a => isEqual(a, x))))
}
export const arraysEqual = (arr1, arr2, isEqual = (a, b) => a === b) => {
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

export const memoize = <T extends (...args) => unknown>(fn: T, getKey): T => {
    const memo = {}
    return ((...args) => {
        const key = getKey(...args)
        if(memo.hasOwnProperty(key)) return memo[key]
        const result = fn(...args)
        memo[key] = result
        return result
    }) as unknown as T
}

export const rand = (n: number) => Math.floor((Math.random()*n))
export const randIndex = list => rand(list.length)

export const randomOrder = (list) => {
    list = [...list]
    for(let i = 0; i < list.length; i++){
        const ri = randIndex(list)
        const tmp = list[i]
        list[i] = list[ri]
        list[ri] = tmp
    }
    return list
}