import React from 'react'
import * as sudoku from '../core/sudoku'
import { Board, Point, SolveResult } from '../core/types'
import * as solve from '../core/solve'

export type SolverProps = {
    board: Board
    onSolveResult: (solveResult: SolveResult | null, prevBoard: Board) => void
    solveResult: SolveResult | null
}

const getSolverBoard = (board: Board) => {
    board = sudoku.resetCandidates(board)
    board = solve.applyBasicEliminations(board)
    return board
}

const pointToStr = (point: Point) => `r${point.y+1}c${point.x+1}`

export const Solver = (props: SolverProps) => {
    const {board: activeBoard, solveResult, onSolveResult} = props
    const solverBoard = React.useMemo(() => getSolverBoard(activeBoard), [activeBoard])
    const nextTechniqueResult = React.useMemo(() => solve.runTechnique(solverBoard), [solverBoard])
    const [skippedTechniques, setSkippedTechniques] = React.useState<string[]>([])

    const onToggleTechnique = (type: string) => {
        setSkippedTechniques(s => {
            if(s.some(t => t === type)){
                return s.filter(t => t !== type)
            }else{
                return [...s, type]
            }
        })
    }
    const iterate = () => {
        let prevBoard = solverBoard
        let res = solve.iterate(solverBoard)
        while(res !== null && skippedTechniques.includes(res.technique)){
            prevBoard = res.board
            res = solve.iterate(res.board)
        }
        onSolveResult(res, prevBoard)
    }

    return (
        <div>
            Next available technique: {nextTechniqueResult?.technique}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={iterate}>Iterate</button>
            </div>
            <div>
                Skip techniques
                <div style={{display: 'flex', flexDirection: 'column'}}>
                {solve.techniques.map(tech => {
                    const skipped = skippedTechniques.some(t => t === tech.type)
                    return (
                        <button style={{color: skipped ? 'red' : ''}} onClick={() => onToggleTechnique(tech.type)}>
                            {tech.type}
                        </button>
                    )
                })}
                </div>
            </div>

            {solveResult &&
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div>
                    Technique: {solveResult.technique}
                    <br />
                    Effects
                    {solveResult.effects.map(effect => {
                        return (
                            <div>
                                {effect.type === 'elimination' &&
                                <div>
                                    Eliminate {effect.numbers.join(',')} from {pointToStr(effect.point)}
                                </div>
                                }
                                {effect.type === 'value' &&
                                <div>
                                    Set {effect.number} at {pointToStr(effect.point)}
                                </div>
                                }
                            </div>
                        )
                    })}
                    <br />
                    Actors:
                    {solveResult.actors.map(actor => {
                        return (
                            <div>
                                {pointToStr(actor.point)}
                            </div>
                        )
                    })}
                </div>
            </div>
            }
        </div>
    )
}