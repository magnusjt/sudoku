import { Board, InputMode, Point, SolveResult } from './core/types'
import { BoardMetaData } from './core/utils/getBoardMetaData'
import { applyInputValue, boardFromStr, boardToStr, prepareBoardForSolver } from './core/sudoku'
import { boardHasError, boardIsComplete, pointsEqual } from './core/utils/sudokuUtils'
import { uniqueBy } from './core/utils/misc'

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

export type State = {
    puzzles: BoardMetaData[],
    userData: UserData
    game: {
        initialBoard: Board
        board: Board
        boardMetaData: BoardMetaData
        boardStack: Board[]
        solver: {
            boardBeforeSolve: Board
            solveResult: SolveResult | null
        } | null
    } | null
    inputMode: InputMode
    selectedCells: Point[]
    selectedDigit: number | null
}

const initialState: State = {
    puzzles: [],
    userData: {
        solved: [],
        custom: [],
        progress: {}
    },
    game: null,
    inputMode: 'value',
    selectedCells: [],
    selectedDigit: null
}

type SetState = Partial<State> | ((state: State) => Partial<State>)
type Action = { type: string, state: SetState }

export const reducer = (state: State = initialState, action: Action) => {
    return {
        ...state,
        ...(typeof action.state === 'function' ? action.state(state) : action.state)
    }
}

export type Storage = {
    store: (data: UserData) => any
}

/*
Intercepts changes to userData and puts it in storage
 */
export const createStorageMiddleware = (storage: Storage) => store => {
    let prevUserData = store.getState().userData
    return next => action => {
        next(action)
        const currUserData = store.getState().userData
        console.log('checking')
        if (prevUserData !== currUserData) {
            console.log('storing')
            storage.store(currUserData)
            prevUserData = currUserData
        }
    }
}

const omit = (obj, key) => {
    obj = {...obj}
    delete obj[key]
    return obj
}

export const createActions = dispatch => {
    const setState = (type: string, state: SetState) => dispatch(({ state, type }))

    const setInputMode = (inputMode: InputMode) => setState('setInputMode', { inputMode })
    const setPuzzles = (puzzles: BoardMetaData[]) => setState('setPuzzles', { puzzles })
    const setUserData = (userData: UserData) => setState('setUserData', { userData })
    const selectDigit = (digit: number) => setState('setDigit', state => {
        return {
            selectedDigit: state.selectedDigit === digit ? null : digit
        }
    })
    const setSelectedCells = (selectedCells: Point[]) => setState('setSelectedCells', { selectedCells })
    const addSelectedCell = (cell: Point) => setState('addSelectedCell', state => {
        return {
            selectedCells: uniqueBy([...state.selectedCells, cell], pointsEqual)
        }
    })

    const startGame = (board: Board, boardMetaData: BoardMetaData) => setState('startGame', state => {
        return {
            game: {
                initialBoard: board,
                board,
                boardMetaData,
                boardStack: [],
                solver: (state.game?.solver ?? null) !== null
                    ? {
                        boardBeforeSolve: prepareBoardForSolver(board),
                        solveResult: null
                    }
                    : null
            },
            selectedCells: [],
            selectedDigit: null
        }
    })

    const startPuzzle = (metaData: BoardMetaData, fromProgress: boolean) => setState('selectPuzzle', state => {
        const originalBoard = boardFromStr(metaData.boardData)
        const progress = fromProgress ? state.userData.progress[metaData.boardData] ?? null : null
        const board = progress ? progress : originalBoard

        return {
            game: {
                initialBoard: board,
                board,
                boardMetaData: metaData,
                boardStack: [],
                solver: (state.game?.solver ?? null) !== null
                    ? {
                        boardBeforeSolve: prepareBoardForSolver(board),
                        solveResult: null
                    }
                    : null
            },
            selectedCells: [],
            selectedDigit: null
        }
    })

    const toggleSolver = (solutionBoard: Board | null) => setState('toggleSolver', state => {
        if (!state.game || !solutionBoard) return state

        if (state.game.solver) {
            return {
                game: {
                    ...state.game,
                    solver: null
                }
            }
        } else {
            if (boardHasError(state.game.board, solutionBoard)) {
                return state
            }
            return {
                game: {
                    ...state.game,
                    solver: {
                        boardBeforeSolve: prepareBoardForSolver(state.game.board),
                        solveResult: null
                    }
                },
                selectedCells: [],
                selectedDigit: null
            }
        }
    })

    const setSolveResult = (solveResult: SolveResult | null, boardBeforeSolve: Board) => setState('setSolveResult', state => {
        if(!state.game) return state

        return {
            game: {
                ...state.game,
                solver: {
                    boardBeforeSolve,
                    solveResult
                }
            }
        }
    })

    const playFromSolver = () => setState('playFromSolver', state => {
        if (!state.game || !state.game.solver) {
            return state
        }

        return {
            game: {
                ...state.game,
                boardStack: [state.game.board, ...state.game.boardStack],
                board: state.game.solver.boardBeforeSolve,
                solver: null
            }
        }
    })

    const setDigit = (digit: number, points: Point[], solutionBoard: Board | null) => setState('setDigit', state => {
        if (!state.game || !solutionBoard || state.game.solver) return state

        const board = applyInputValue(state.game.board, points, digit, state.inputMode)
        const boardStr = boardToStr(state.game.initialBoard)

        let userData = state.userData
        if(boardIsComplete(board) && !boardHasError(board, solutionBoard)){
            userData = {
                ...userData,
                solved: [boardStr, ...userData.solved],
                progress: omit(userData.progress, boardStr)
            }
        }else{
            userData = {
                ...userData,
                progress: {
                    ...userData.progress,
                    [boardStr]: board
                }
            }
        }

        return {
            userData,
            game: {
                ...state.game,
                board,
                boardStack: [state.game.board, ...state.game.boardStack]
            }
        }
    })

    const undo = () => setState('undo', state => {
        if (!state.game || state.game.solver) return state
        if (state.game.boardStack.length === 0) return state

        return {
            game: {
                ...state.game,
                board: state.game.boardStack[0],
                boardStack: state.game.boardStack.slice(1)
            }
        }
    })

    return {
        setPuzzles,
        setUserData,
        selectDigit,
        setSelectedCells,
        addSelectedCell,
        startGame,
        startPuzzle,
        toggleSolver,
        setSolveResult,
        playFromSolver,
        setDigit,
        setInputMode,
        undo
    }
}