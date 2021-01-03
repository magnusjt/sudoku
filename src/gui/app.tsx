import React from 'react'
import { BoardDisplay } from './board'
import { Solver } from './solver'
import { Board, InputMode, Point, SolveResult } from '../core/types'
import { applyInputValue, prepareMessedUpBoardForSolver } from '../core/sudoku'
import { generateBoards } from '../core/generate'
import { getTechniquesRequiredForSolvingBoard } from '../core/solve'
import { first } from '../core/utils'

/*
const input = [ // Easy
    [0, 3, 1, 0, 0, 0, 0, 0, 6],
    [0, 4, 9, 2, 0, 0, 0, 3, 8],
    [0, 2, 0, 0, 1, 0, 0, 4, 5],
    [7, 5, 0, 0, 0, 6, 0, 0, 0],
    [2, 0, 8, 0, 0, 5, 6, 0, 0],
    [0, 9, 6, 0, 3, 2, 7, 5, 0],
    [0, 6, 2, 0, 7, 0, 0, 0, 4],
    [0, 0, 5, 0, 0, 9, 3, 0, 7],
    [0, 7, 0, 5, 6, 1, 0, 2, 0],
]*/
/*
const input = [ // Hard
    [0, 7, 0, 0, 0, 0, 0, 0, 4],
    [0, 4, 0, 0, 2, 0, 6, 0, 3],
    [8, 0, 1, 0, 4, 0, 0, 0, 7],
    [4, 0, 0, 0, 6, 0, 0, 7, 0],
    [0, 0, 3, 1, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 5, 0, 0],
    [1, 0, 0, 0, 0, 0, 8, 0, 2],
    [0, 0, 0, 2, 0, 8, 0, 0, 0],
    [0, 0, 4, 7, 5, 0, 0, 0, 0],
]
*/

const input = [ // Expert
    [0, 6, 0, 4, 0, 5, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 4, 0, 0],
    [3, 7, 0, 0, 0, 0, 0, 0, 6],
    [0, 3, 1, 6, 0, 0, 0, 0, 0],
    [0, 0, 0, 8, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 4, 0, 0, 0, 1],
    [0, 0, 3, 2, 0, 0, 0, 0, 0],
    [4, 0, 0, 0, 0, 0, 8, 0, 0],
    [0, 1, 8, 0, 0, 6, 7, 5, 0],
]
//let initialBoard = sudoku.boardFromInput(input, false)
let initialBoard = first(generateBoards(30))
console.log(getTechniquesRequiredForSolvingBoard(initialBoard))

export function App(){
    const [board, setBoard] = React.useState(initialBoard)
    const [solveResult, setSolveResult] = React.useState<SolveResult | null>(null)
    const [solverEnabled, setSolverEnabled] = React.useState(false)
    const [inputMode, setInputMode] = React.useState<InputMode>('value')
    const solverBoard = React.useMemo(() => {
        if(solveResult === null){
            return prepareMessedUpBoardForSolver(board)
        }else{
            return solveResult.board
        }
    }, [board, solveResult])

    const onSetSolveResult = (solveResult: SolveResult | null, boardBeforeSolve: Board) => {
        setBoard(boardBeforeSolve)
        setSolveResult(solveResult)
    }
    const toggleSolver = () => {
        if(solverEnabled){
            setSolverEnabled(false)
            setSolveResult(null)
        }else{
            setSolverEnabled(true)
        }
    }
    const onSetDigit = (digit: number, points: Point[]) => {
        const nextBoard = applyInputValue(board, points, digit, inputMode)
        setBoard(nextBoard)
        setSolveResult(null) // Remove solve result whenever input is applied. The solve may not be valid anymore.
    }
    const onKeyDown = (e) => {
        if(e.key.toLowerCase() === 'a') setInputMode('value')
        if(e.key.toLowerCase() === 's') setInputMode('candidates')
    }

    return (
        <div onKeyDown={onKeyDown} tabIndex={-1}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div>
                    <BoardDisplay
                        board={board}
                        solveResult={solveResult}
                        onSetDigit={onSetDigit}
                    />
                    <button onClick={() => setInputMode('value')} disabled={inputMode === 'value'}>Digit (a)</button>
                    <button onClick={() => setInputMode('candidates')} disabled={inputMode === 'candidates'}>Candidate (s)</button>
                    <button onClick={toggleSolver}>{solverEnabled ? 'Hide solver' : 'Show solver'}</button>
                </div>
                {solverEnabled &&
                    <div>
                        <Solver
                            board={solverBoard}
                            solveResult={solveResult}
                            onSolveResult={onSetSolveResult}
                        />
                    </div>
                }
            </div>
        </div>
    )
}