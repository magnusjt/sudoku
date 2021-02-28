import { UserData } from './state'

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