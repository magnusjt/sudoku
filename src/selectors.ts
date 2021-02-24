import { createSelector } from 'reselect'
import { Board } from './core/types'
import { getSolution, getTechniquesRequiredForSolvingBoard } from './core/solve'
import { boardHasError, boardIsComplete } from './core/utils/sudokuUtils'
import { getTechniquesUntilNextValue, prepareBoardForSolver } from './core/sudoku'
import { State, UserData } from './state'
import { BoardMetaData } from './core/utils/getBoardMetaData'

export const selectSolution = createSelector(
    (state: State) => state.game?.initialBoard ?? null,
    (board: Board | null) => {
        if (!board) return null
        return getSolution(board)
    }
)
export const selectHasError = createSelector(
    (state: State) => state.game?.board ?? null,
    selectSolution,
    (board: Board | null, solution: Board | null) => {
        if (!board || !solution) return null
        return boardHasError(board, solution)
    }
)
export const selectIsComplete = createSelector(
    (state: State) => state.game?.board ?? null,
    (board: Board | null) => {
        if (!board) return false
        return boardIsComplete(board)
    }
)
export const selectHints = createSelector(
    (state: State) => state.game?.board ?? null,
    selectHasError,
    (board: Board | null, hasError: boolean | null) => {
        if (!board || hasError === null) return []
        if (hasError) return []
        return getTechniquesUntilNextValue(prepareBoardForSolver(board))
    }
)
export const selectPuzzles = createSelector(
    (state: State) => state.puzzles,
    (puzzles: BoardMetaData[]) => puzzles
)
export const selectUserData = createSelector(
    (state: State) => state.userData,
    (userData: UserData) => userData
)