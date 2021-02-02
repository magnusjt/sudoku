import { Board } from '../core/types'
import { unique } from '../core/utils/misc'

export type UserData = {
    solved: string[]
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

    return data
}
const serialize = (data: UserData): string => {
    return JSON.stringify(data)
}
const merge = (data: UserData, existing: UserData): UserData => {
    return {
        solved: unique([...data.solved, ...existing.solved]),
        progress: {...existing.progress, ...data.progress}
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
export const mergeUserData = (data: UserData) => {
    const existing = localStorageGet()
    localStorageSet(merge(data, existing))
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