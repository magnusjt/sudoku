import React from 'react'
import { BoardDisplay } from './board'
import { Solver } from './solver'
import { Board, InputMode, Point, SolveResult } from '../core/types'
import { applyInputValue, boardFromStr, getTechniquesUntilNextValue, prepareBoardForSolver } from '../core/sudoku'
import { getSolution, getTechniquesRequiredForSolvingBoard } from '../core/solve'
import useEventListener from '@use-it/event-listener'
import Paper from '@material-ui/core/Paper'

let initialBoard = boardFromStr('500000930720900006001000000050002309000010800300057602005000090400103005000260000')
console.log(getTechniquesRequiredForSolvingBoard(initialBoard))
const solutionBoard = getSolution(initialBoard)

export function App(){
    const [board, setBoard] = React.useState(initialBoard)
    const [boardStack, setBoardStack] = React.useState<Board[]>([])
    const [solveResult, setSolveResult] = React.useState<SolveResult | null>(null)
    const [solverEnabled, setSolverEnabled] = React.useState(false)
    const [inputMode, setInputMode] = React.useState<InputMode>('value')
    const [hintsEnabled, setHintsEnabled] = React.useState(false)
    const solverBoard = React.useMemo(() => {
        if(solveResult === null){
            return prepareBoardForSolver(board)
        }else{
            return solveResult.board
        }
    }, [board, solveResult])

    const hints = React.useMemo(() => getTechniquesUntilNextValue(prepareBoardForSolver(board)), [board])

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
    const toggleHints = () => {
        setHintsEnabled(x => !x)
    }
    const onSetDigit = (digit: number, points: Point[]) => {
        const nextBoard = applyInputValue(board, points, digit, inputMode)
        setBoard(nextBoard)
        setBoardStack(stack => [board, ...stack])
        setSolveResult(null) // Remove solve result whenever input is applied. The solve may not be valid anymore.
    }
    const onUndo = () => {
        if(boardStack.length === 0){
            return
        }
        setBoard(boardStack[0])
        setBoardStack(stack => stack.slice(1))
    }

    useEventListener('keydown', (e: KeyboardEvent) => {
        if(e.key.toLowerCase() === 'a') setInputMode('value')
        if(e.key.toLowerCase() === 's') setInputMode('candidates')
        if(e.key.toLowerCase() === 'n') onUndo()
        if(e.key.toLowerCase() === 'c') toggleSolver()
        if(e.key.toLowerCase() === 'h') toggleHints()
    })

    return (
        <div style={{ height: '100%', minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ height: '100%', minHeight: 0, display: 'flex', padding: 16 }}>
                <Paper style={{ height: '100%', padding: 16 }}>
                    <BoardDisplay
                        board={board}
                        solveResult={solveResult}
                        onSetDigit={onSetDigit}
                        solutionBoard={solutionBoard}
                    />
                    <button onClick={() => setInputMode('value')} disabled={inputMode === 'value'}>Digit (a)</button>
                    <button onClick={() => setInputMode('candidates')} disabled={inputMode === 'candidates'}>Candidate (s)</button>
                    <button onClick={onUndo} disabled={boardStack.length === 0}>Undo (n)</button>
                    <button onClick={toggleSolver}>{solverEnabled ? 'Hide solver (c)' : 'Show solver (c)'}</button>
                    <button onClick={toggleHints}>{hintsEnabled ? 'Hide hints (h)' : 'Show hints (h)'}</button>
                    {hintsEnabled &&
                        <div>
                            <h4>Hints</h4>
                            <p>Techniques that are required in order to place the next digit</p>
                            <ul>
                                {hints.map(t => <li>{t}</li>)}
                            </ul>
                        </div>
                    }
                </Paper>
                {solverEnabled &&
                    <Paper style={{ height: '100%', padding: 16, marginLeft: 16 }}>
                        <Solver
                            board={solverBoard}
                            solveResult={solveResult}
                            onSolveResult={onSetSolveResult}
                        />
                    </Paper>
                }
            </div>
        </div>
    )
}