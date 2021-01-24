import React from 'react'
import { BoardDisplay } from './board'
import { Solver } from './solver'
import { Board, InputMode, Point, SolveResult } from '../core/types'
import { applyInputValue, boardFromStr, prepareBoardForSolver } from '../core/sudoku'
import { getSolution, getTechniquesRequiredForSolvingBoard } from '../core/solve'

let initialBoard = boardFromStr('500000930720900006001000000050002309000010800300057602005000090400103005000260000')
console.log(getTechniquesRequiredForSolvingBoard(initialBoard))
const solutionBoard = getSolution(initialBoard)

export function App(){
    const [board, setBoard] = React.useState(initialBoard)
    const [solveResult, setSolveResult] = React.useState<SolveResult | null>(null)
    const [solverEnabled, setSolverEnabled] = React.useState(false)
    const [inputMode, setInputMode] = React.useState<InputMode>('value')
    const solverBoard = React.useMemo(() => {
        if(solveResult === null){
            return prepareBoardForSolver(board)
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
                        solutionBoard={solutionBoard}
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