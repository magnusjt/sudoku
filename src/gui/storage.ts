import { Board } from '../core/types'
import { unique, uniqueBy } from '../core/utils/misc'
import { BoardMetaData } from '../core/utils/getBoardMetaData'

export type UserData = {
    solved: string[]
    custom: {
        meta: BoardMetaData
        date: string
    }[]
    progress: {
        [key: string]: Board
    }
}

const deserialize = (data: any): UserData => {
    if(!data.solved){
        data.solved = []
    }
    if(!data.progress){
        data.progress = {}
    }
    if(!data.custom){
        data.custom = []
    }

    return data
}
const serialize = (data: UserData): string => {
    return JSON.stringify(data)
}
const merge = (data: Partial<UserData>, existing: UserData): UserData => {
    return {
        solved: unique([...(data.solved ?? []), ...existing.solved]),
        progress: {...existing.progress, ...data.progress},
        custom: uniqueBy([...(data.custom ?? []), ...existing.custom], (a, b) => a.meta?.boardData === b.meta?.boardData)
    }
}

const localStorageGet = () => {
    try{
        const data = JSON.parse(localStorage.getItem('sudoku') ?? '{}')
        return deserialize(data)
    }catch(err){
        return deserialize({})
    }
}

const localStorageSet = (value: UserData) => {
    try{
        localStorage.setItem('sudoku', serialize(value))
    }catch(err){}
}

export const loadUserData = (): UserData => {
    return localStorageGet()
}
export const storeUserData = (data: UserData) => {
    localStorageSet(data)
}
export const mergeUserData = (data: Partial<UserData>) => {
    const existing = localStorageGet()
    localStorageSet(merge(data, existing))
    return localStorageGet()
}

export const addSolvedBoard = (boardStr: string) => {
    const data = localStorageGet()
    data.solved.push(boardStr)
    delete data.progress[boardStr]
    localStorageSet(data)
    return data
}

export const addBoardProgress = (boardStr: string, board: Board) => {
    const data = localStorageGet()
    data.progress[boardStr] = board
    localStorageSet(data)
    return data
}