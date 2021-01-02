import * as sudoku from '../core/sudoku'
import React from 'react'
import { BoardDisplay } from './board'
import { Solver } from './solver'
import { Board, InputMode, Point, SolveResult } from '../core/types'
import { applyInputValue } from '../core/sudoku'

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
let initialBoard = sudoku.boardFromInput(input, false)

export function App(props){
    const [board, setBoard] = React.useState(initialBoard)
    const [solveResult, setSolveResult] = React.useState<SolveResult | null>(null)
    const [solverEnabled, setSolverEnabled] = React.useState(false)
    const [inputMode, setInputMode] = React.useState<InputMode>('normal')

    const onSetSolveResult = (solveResult: SolveResult | null, prevBoard: Board) => {
        setBoard(prevBoard)
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
    }
    const onKeyDown = (e) => {
        if(e.key.toLowerCase() === 'a'){
            setInputMode('normal')
        }
        if(e.key.toLowerCase() === 's'){
            setInputMode('candidates')
        }
        console.log(e.key)
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
                    <button onClick={toggleSolver}>{solverEnabled ? 'Hide solver' : 'Show solver'}</button>
                </div>
                {solverEnabled &&
                    <div>
                        <Solver
                            board={solveResult?.board ?? board}
                            solveResult={solveResult}
                            onSolveResult={onSetSolveResult}
                        />
                    </div>
                }
            </div>
        </div>
    )
}